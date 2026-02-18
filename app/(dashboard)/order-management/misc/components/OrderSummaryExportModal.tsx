import React, { useRef } from 'react';
import { X, Share2 } from 'lucide-react';
import Image from 'next/image';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/utils/currency';
import { Dialog, DialogContent, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { formatTimeString } from '@/utils/strings';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDate } from 'date-fns';
import { TOrder } from '../types';
import { TDiscount } from '../api/getDiscounts';

interface ModalProps {
    isModalOpen: boolean;
    closeModal: () => void;
    order: TOrder;
    discount: TDiscount | undefined;
}

const OrderSummaryExportModal: React.FC<ModalProps> = ({
    isModalOpen,
    closeModal,
    order,
    discount
}) => {
    const receiptRef = useRef<HTMLDivElement>(null);

    if (!order) return null;

    const discount_amount = Number(discount?.amount || '0');
    const subtotal = Number(order.total_selling_price) ;
    const total = Number(order.total_amount) - discount_amount;
    const deliveryFee = Number(order.delivery.dispatch?.delivery_price) || 0;
    const tax = total - subtotal - deliveryFee;

    const generatePDF = async () => {
        if (receiptRef.current) {
            const canvas = await html2canvas(receiptRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: null
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width / 2, canvas.height / 2]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
            pdf.save(`order_${order.order_number}.pdf`);
        }
    };

    const generateImage = async () => {
        if (receiptRef.current) {
            const canvas = await html2canvas(receiptRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: null
            });
            const imgData = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = imgData;
            link.download = `order_${order.order_number}.png`;
            link.click();
        }
    };

    const shareReceipt = async (type: 'pdf' | 'image') => {
        let file: File;
        const canvas = await html2canvas(receiptRef.current!, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: null
        });
        if (type === 'pdf') {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width / 2, canvas.height / 2]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
            const pdfBlob = pdf.output('blob');
            file = new File([pdfBlob], `order_${order.order_number}.pdf`, { type: 'application/pdf' });
        } else {
            const imgBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
            if (!imgBlob) {
                throw new Error('Failed to create image blob');
            }
            file = new File([imgBlob], `order_${order.order_number}.png`, { type: 'image/png' });
        }

        if (navigator.share) {
            try {
                await navigator.share({
                    files: [file],
                    title: `Order ${order.order_number} Receipt`,
                    text: 'Check out my order receipt!',
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            console.log('Web Share API not supported');
            // Fallback: You could open a modal with a copyable link or QR code here
        }
    };

    return (
        <Dialog open={isModalOpen}>
            <DialogContent
                onPointerDownOutside={closeModal}
                className="flex flex-col items-center justify-center p-0 !rounded-2xl min-w-full lg:min-w-[50%] max-w-[600px] max-h-[98vh] overflow-y-auto"
            >
                <DialogClose
                    onClick={closeModal}
                    className="rounded-full p-2 hover:bg-gray-100 focus:outline-none"
                >
                    <X className="h-6 w-6" />
                    <span className="sr-only">Close</span>
                </DialogClose>

                <Card ref={receiptRef} className="shadow-md w-[450px] text-[0.7rem] rounded-none bg-white">
                    <header className="flex items-center gap-4 bg-[#194A7A] text-white p-4">
                        <div className="flex items-center justify-center bg-white p-2 rounded-md">
                            <Image src='/img/logo.svg' alt='logo' width={40} height={32} />
                        </div>

                        <div className="text-right font-poppins">
                            <h2 className="text-xl font-semibold">{order?.branch?.name}</h2>
                            <p className="text-xs text-balance">113 Freeman St, Adekunle 101223, Lagos, Nigeria, Lagos, Lagos State</p>
                            <p className="text-xs font-medium">zuzudelight@gmail.com | +234 8154354433</p>
                        </div>
                    </header>

                    <div className="px-4 py-6">
                        <div className="flex justify-between mb-6">
                            <div>
                                <h3 className="font-medium text-[0.625rem] text-[#113770]">BILLED TO:</h3>
                                <p className="text-[#545B6A] text-sm">{order.customer.name}</p>
                                <p className="text-[#8E8E8E] text-[0.625rem]">Phone Number: {" "}
                                    <span className="text-[#0F172B] font-medium">
                                        {order.customer.phone}
                                    </span>
                                </p>
                                <p className="text-[#8E8E8E] text-[0.625rem]">Delivery Address: {" "}
                                    <span className="text-[#0F172B] font-medium">
                                        {order.delivery.address}
                                    </span>
                                </p>
                            </div>
                            <div className="text-right">
                                <p>Order ID: {order.order_number}</p>
                                <p>Issued Date: {formatDate(new Date(), "dd/MM/yyyy - hh:mma")}</p>
                            </div>
                        </div>

                        <div className="mb-6 font-poppins">
                            <h3 className="font-medium text-[0.625rem] text-[#113770]">PAY INTO:</h3>

                            <p className="text-[#545B6A] text-[0.65rem]">
                                Bank Name: {" "}
                                <span className="font-medium">
                                    9 Payment Service Bank (9PSB)
                                </span>
                            </p>

                            <p className="text-[#545B6A] text-[0.65rem]">
                                Account Name: {" "}
                                <span className="font-medium">
                                    Zuzu delight
                                </span>
                            </p>

                            <p className="text-[#545B6A] text-[0.65rem]">
                                Account Number: {" "}
                                <span className="font-medium">
                                    000222999111
                                </span>
                            </p>

                        </div>

                        <table className="w-full mb-6 rounded-t-xl overflow-hidden">
                            <thead className="bg-[#194A7A] text-white">
                                <tr className=" overflow-hidden">
                                    <th className="py-2 px-4 text-left rounded-tl-2xl">Description</th>
                                    <th className="py-2 px-4 text-center">Qty</th>
                                    <th className="py-2 px-4 text-right">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((item, index: number) => (
                                    <tr key={index} className="border-b text-[0.625rem]">
                                        <td className="py-2 px-4">{item.product.name}</td>
                                        <td className="py-2 px-4 text-center">{item.quantity}</td>
                                        <td className="py-2 px-4 text-right">
                                            {formatCurrency(
                                                Number(item.product_variation.selling_price) * item.quantity,
                                                'NGN'
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="flex justify-end">
                            <div className="w-full divide-y">
                                <div className="flex justify-between py-1.5 px-4">
                                    <span className="text-[#8E8E8E]">Sub total</span>
                                    <span>{formatCurrency(subtotal, 'NGN')}</span>
                                </div>
                                <div className="flex justify-between py-1.5 px-4">
                                    <span className="text-[#8E8E8E]">Tax</span>
                                    <span>{formatCurrency(tax, 'NGN')}</span>
                                </div>
                                <div className="flex justify-between py-1.5 px-4">
                                    <span className="text-[#8E8E8E]">Discount</span>
                                    <span className="text-red-500">-{formatCurrency(discount_amount, 'NGN')}</span>
                                </div>
                                <div className="flex justify-between pt-1.5 pb-5 px-4">
                                    <span className="text-[#8E8E8E]">Delivery Fee</span>
                                    <span>{formatCurrency(deliveryFee, 'NGN')}</span>
                                </div>
                                <div className="flex justify-between font-semibold text-lg border-t border-t-[#31A5F9] pt-2 mt-3">
                                    <span>Total</span>
                                    <span>{formatCurrency(total, 'NGN')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                <DialogFooter className="px-6 py-4 bg-gray-50">
                    <div className="w-full flex justify-center gap-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="h-14 w-[216px]" variant="outline">
                                    Download
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[216px]">
                                <DropdownMenuItem onClick={generatePDF}>
                                    Download as PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={generateImage}>
                                    Download as Image
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="h-14 w-[216px] bg-black">
                                    <Share2 className="mr-2 h-4 w-4" /> Share
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[216px]">
                                <DropdownMenuItem onClick={() => shareReceipt('pdf')}>
                                    Share as PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => shareReceipt('image')}>
                                    Share as Image
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default OrderSummaryExportModal;

