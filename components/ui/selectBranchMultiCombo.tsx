'use client'

import * as React from 'react'
import { SearchIcon, ArrowLeft, X as XIcon, CheckIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { SmallSpinner } from '@/icons/core'

import { Button, buttonVariants, Popover, PopoverContent, PopoverTrigger } from '.'
import { Label } from './label'
import FormError from './formError'

import axios from '@/utils/axios'
import { useGetAllBusinesses, useGetBusinessBranches } from '@/app/(dashboard)/admin/businesses/misc/api'

interface BranchSelectorMultiProps {
  value: string[] | undefined
  onChange: (values: string[]) => void
  name: string
  placeholder?: string
  className?: string
  containerClass?: string
  itemClass?: string
  withIcon?: boolean
  isLoadingOptions?: boolean
  triggerColor?: string
  hasError?: boolean
  errorMessage?: string
  optional?: boolean
  initialSelectedOptions?: Branch[]
}

type Business = {
  id: string
  name: string
}

type Branch = {
  id: string
  name: string
}

const SelectBranchMultiCombo = ({
  value,
  onChange,
  name,
  placeholder = 'Select branches',
  className,
  containerClass,
  itemClass,
  withIcon,
  isLoadingOptions,
  initialSelectedOptions,
  triggerColor,
  hasError,
  errorMessage,
  optional
}: BranchSelectorMultiProps) => {
  const [isOpen, setOpen] = React.useState(false)
  const [view, setView] = React.useState<'businesses' | 'branches'>('businesses')
  const [selectedBusiness, setSelectedBusiness] = React.useState<Business | null>(null)
  const [searchText, setSearchText] = React.useState<string>('')

  const { data: allBusinessesResp, isLoading: isLoadingBusinesses } = useGetAllBusinesses()
  const { data: branchesResp, isLoading: isLoadingBranches } = useGetBusinessBranches({
    business_id: selectedBusiness ? Number(selectedBusiness.id) : undefined,
    page: 1,
    size: 100,
    search: searchText
  })
  const [branchesMap, setBranchesMap] = React.useState<Record<string, string>>({})
  const [fetchError, setFetchError] = React.useState<string | null>(null)

  const triggerRef = React.useRef<HTMLButtonElement | null>(null)
  const [width, setWidth] = React.useState<string>('50%')
  React.useEffect(() => {
    if (triggerRef?.current) {
      setWidth(`${triggerRef.current.clientWidth}px`)
    }
  }, [triggerRef?.current?.clientWidth])

  // ensure view resets when opening
  React.useEffect(() => {
    if (!isOpen) return
    setView('businesses')
    setSelectedBusiness(null)
    setFetchError(null)
  }, [isOpen])

  const fetchBranches = (business: Business) => {
    // selecting a business will cause the branches hook to refetch because options change
    setFetchError(null)
    setSelectedBusiness(business)
    setView('branches')
    // merge any existing branches names into cache if branchesResp already contains data for this business
    const raw = branchesResp ?? null
    const dataArray = raw ? (Array.isArray(raw) ? raw : (raw?.data ?? raw?.data ?? [])) : []
    const normalized = (dataArray as any[]).map(item => ({ id: String(item.id ?? item.business_id ?? item._id ?? ''), name: String(item.name ?? item.branch_name ?? item.title ?? '') }))
    if (normalized && normalized.length) {
      setBranchesMap(prev => ({ ...prev, ...Object.fromEntries((normalized as Branch[]).map((b: Branch) => [String(b.id), b.name])) }))
    }
  }

  const toggleBranchSelection = (branchId: string) => {
    const current = value ?? []
    if (current.map(String).includes(String(branchId))) {
      const next = current.filter(v => v !== branchId)
      onChange(next)
    } else {
      const next = [...current, branchId]
      onChange(next)
    }
  }

  const removeBranch = (branchId: string) => {
    const current = value ?? []
    const next = current.filter(v => v !== branchId)
    onChange(next)
  }

  const businessesList: Business[] = React.useMemo(() => {
    const raw = allBusinessesResp ?? null
    const dataArray = raw ? (Array.isArray(raw) ? raw : (raw?.data ?? raw?.data ?? [])) : []
    return (dataArray as any[]).map(item => ({ id: String(item.id ?? item.business_id ?? item._id ?? ''), name: String(item.name ?? item.business_name ?? item.title ?? '') }))
  }, [allBusinessesResp])

  const filteredBusinesses = React.useMemo(() => {
    if (!businessesList) return []
    if (!searchText.trim()) return businessesList
    return businessesList.filter(b => String(b.name).toLowerCase().includes(searchText.toLowerCase()))
  }, [businessesList, searchText])

  const branchesList: Branch[] = React.useMemo(() => {
    const raw = branchesResp ?? null
    const dataArray = raw ? (Array.isArray(raw) ? raw : (raw?.data ?? raw?.data ?? [])) : []
    return (dataArray as any[]).map(item => ({ id: String(item.id ?? item.business_id ?? item._id ?? ''), name: String(item.name ?? item.branch_name ?? item.title ?? '') }))
  }, [branchesResp])

  const filteredBranches = React.useMemo(() => {
    if (!branchesList) return []
    if (!searchText.trim()) return branchesList
    return branchesList.filter(b => String(b.name).toLowerCase().includes(searchText.toLowerCase()))
  }, [branchesList, searchText])

  // Render selected chips below trigger
  const selectedChips = React.useMemo(() => {
    const selectedIds = value ?? [];

    // If preload provided, merge into branchesMap
    if (initialSelectedOptions && initialSelectedOptions.length > 0) {
      initialSelectedOptions.forEach(opt => {
        branchesMap[opt.id] = opt.name;
      });
    }

    return selectedIds.map(id => ({
      id,
      name: branchesMap[id] ?? id
    }));
  }, [value, branchesMap, initialSelectedOptions]);


  // Fetch missing branch names for any pre-selected ids that are not in the branchesMap
  React.useEffect(() => {
    const ids = value ?? []
    const missing = ids.filter(id => !branchesMap[id])
    if (!missing.length) return
    let cancelled = false

    const fetchMissing = async () => {
      try {
        await Promise.all(missing.map(async (id) => {
          try {
            const res = await axios.get(`/admin/branches/${id}`)
            const data = res?.data?.data ?? res?.data ?? {}
            const name =
              data?.name ??
              data?.branch_name ??
              data?.branch?.name ??
              data?.title ??
              String(id)
            if (!cancelled) {
              setBranchesMap(prev => ({ ...prev, [id]: name }))
            }
          } catch (err) {
            // ignore individual fetch errors, fallback to id
            if (!cancelled) setBranchesMap(prev => ({ ...prev, [id]: id }))
          }
        }))
      } catch (err) {
        // overall fetch error; do nothing
      }
    }

    fetchMissing()

    return () => { cancelled = true }
  }, [value, branchesMap])

  return (
    <div className={cn('inputdiv', withIcon && 'withicon', containerClass)}>
      <Popover open={isOpen} onOpenChange={setOpen}>
        <div className="flex flex-col gap-2">
          <Label className="text-sm text-[#0F172B] font-poppins font-medium" htmlFor={name || 'branch-multi-select'}>
            Branches
            {!optional && <span className="text-red-400 font-medium"> *</span>}
          </Label>
          <PopoverTrigger asChild>
            <Button
              variant="inputButton"
              size="inputButton"
              className={cn('flex w-full items-center justify-between gap-2 text-left text-sm transition duration-300', className)}
              type="button"
              role="combobox"
              onClick={() => setOpen(!isOpen)}
              ref={triggerRef}
              disabled={isLoadingOptions}
            >
              <span className={cn('!overflow-hidden text-sm w-full font-normal', (value && value.length) ? '' : '!text-[#A4A4A4]')}>
                {(value && value.length) ? `${value.length} selected` : placeholder
                }
              </span>
              <svg
                className={cn('ml-2  shrink-0 opacity-70 transition-transform duration-300', isOpen && 'rotate-180')}
                fill="none"
                height={7}
                viewBox="0 0 12 7"
                width={12}
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  className={cn('fill-label-text')}
                  clipRule="evenodd"
                  d="M8.357 5.522a3.333 3.333 0 0 1-4.581.126l-.133-.126L.41 2.089A.833.833 0 0 1 1.51.84l.078.07L4.82 4.342c.617.617 1.597.65 2.251.098l.106-.098L10.411.91a.833.833 0 0 1 1.248 1.1l-.07.079-3.232 3.433Z"
                  fill={triggerColor || '#032282'}
                  fillRule="evenodd"
                />
              </svg>
            </Button>
          </PopoverTrigger>
        </div>

        <PopoverContent className={cn('p-0 overflow-hidden', triggerRef?.current && `min-w-max`, isLoadingOptions && 'hidden')} style={{ width }}>
          <div className="">
            <div className="relative px-6">
              <SearchIcon className="absolute top-1/2 left-2 -translate-y-1/2 text-[#032282] h-4 w-4" />
              <input
                className="focus:!ring-0 !ring-0 bg-transparent pl-5 p-3 !outline-none text-sm placeholder:text-[#86898ec7] border-b border-[#E6E6E6] w-full rounded-none"
                placeholder={placeholder || 'Search'}
                type="text"
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            {(isLoadingBusinesses || isLoadingBranches) && (
              <button className="flex items-center justify-center gap-2 text-main-solid py-2 font-medium" disabled>
                <SmallSpinner color="#000000" /> Loading...
              </button>
            )}

            <div className="flex flex-col gap-1.5 px-5 py-3 max-h-[450px] overflow-y-auto">
              {fetchError && (
                <div className="text-sm text-red-500 px-3">{fetchError}</div>
              )}

              {view === 'businesses' && (!(isLoadingBusinesses) && businessesList && businessesList.length > 0 ? (
                (filteredBusinesses || businessesList)?.map((b) => (
                  <button
                    key={String(b.id)}
                    className={cn('text-xs relative flex select-none items-center rounded-md px-3 py-2 outline-none aria-selected:bg-blue-100/70 aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50', itemClass, 'hover:bg-blue-100 w-full text-sm', 'py-2 hover:!bg-primary hover:!text-white cursor-pointer rounded-lg border hover:border-transparent')}
                    onClick={() => fetchBranches(b)}
                  >
                    <span className="flex-1 text-left">{b.name}</span>
                    <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                ))
              ) : (
                <div className={cn('text-[0.8125rem]', itemClass)}>
                  {!isLoadingBusinesses ? "There's no business to select from" : null}
                </div>
              ))}

              {view === 'branches' && (
                <>
                  <div className="flex items-center gap-2 px-1 pb-2">
                    <button className="p-1" onClick={() => { setView('businesses'); setSelectedBusiness(null); setSearchText('') }}>
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className="text-sm font-medium">{selectedBusiness?.name}</div>
                  </div>

                  {(!(isLoadingBranches) && branchesList && branchesList.length > 0) ? (
                    (filteredBranches || branchesList).map((br) => (
                      <button
                        key={String(br.id)}
                        className={cn('text-xs relative flex select-none items-center rounded-md px-3 py-2 outline-none aria-selected:bg-blue-100/70 aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50', itemClass, 'hover:bg-blue-100 w-full text-sm', 'py-2 hover:!bg-primary hover:!text-white cursor-pointer rounded-lg border hover:border-transparent')}
                        onClick={() => toggleBranchSelection(String(br.id))}
                      >
                        <CheckIcon className={cn('mr-2 h-4 w-4', (value ?? []).map(String).includes(String(br.id)) ? 'opacity-100' : 'opacity-0')} />
                        {br.name}
                      </button>
                    ))
                  ) : (
                    <div className={cn('text-[0.8125rem]', itemClass)}>
                      {!isLoadingBranches ? "There's no branch to select from" : null}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected chips */}
      <div className="mt-2 flex flex-wrap gap-2">
        {selectedChips.map(({ id, name }) => (
          <div key={id} className="inline-flex items-center gap-2 bg-gray-100 px-2 py-1 rounded-full text-sm">
            <span>{name}</span>
            <button onClick={() => removeBranch(id)} className="p-1">
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {hasError && errorMessage && (
        <FormError errorMessage={errorMessage} />
      )}
    </div>
  )
}

export default SelectBranchMultiCombo
