# Backlog Import Guide

File:
- docs/backlog-ticket-import.csv

The CSV is hierarchy-safe using these columns:
- external_id: unique stable row ID
- parent_external_id: parent link (Story -> Epic, Task -> Story)
- issue_type: Epic, Story, Task
- summary, description, labels, priority, sprint

## Jira CSV mapping

Map fields during import:
- Summary -> summary
- Description -> description
- Issue Type -> issue_type
- Labels -> labels
- Priority -> priority
- Sprint -> sprint (optional)
- External ID (custom text field) -> external_id
- Parent External ID (custom text field) -> parent_external_id

If your Jira project supports Parent Link directly in CSV imports, map parent_external_id to Parent Link with a pre-import transform from external_id to created issue key.

## Linear / ClickUp / Azure DevOps mapping

Map:
- Title <- summary
- Description <- description
- Type <- issue_type
- Parent <- parent_external_id (using importer relation mapping)
- Labels <- labels
- Priority <- priority

If your tool does not support parent mapping in one pass, import Epics first, then Stories, then Tasks using external_id lookups.
