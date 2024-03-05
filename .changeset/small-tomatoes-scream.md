---
"@instructor-ai/instructor": major
---

Updating zod-stream major and stream output types - this change moves the internal properties tacked onto the stream output from many \_properties to one \_meta object with the properties nested - this also adds explicit types so when used in ts projects it doesnt yell.
