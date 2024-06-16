# @instructor-ai/instructor

## 1.5.0

### Minor Changes

- [#179](https://github.com/instructor-ai/instructor-js/pull/179) [`1b56bd1`](https://github.com/instructor-ai/instructor-js/commit/1b56bd18e0c7c02da94ee70e7837a155c3502b5c) Thanks [@morgante](https://github.com/morgante)! - Restore CommonJS compatibility for OpenAI streaming

### Patch Changes

- [`9486edb`](https://github.com/instructor-ai/instructor-js/commit/9486edb470295067ee7a537fc409132dceba5d10) Thanks [@roodboi](https://github.com/roodboi)! - update mjs import from openai

## 1.4.0

### Minor Changes

- [#182](https://github.com/instructor-ai/instructor-js/pull/182) [`0a5bbd8`](https://github.com/instructor-ai/instructor-js/commit/0a5bbd8082915bcc8c4686d34fec5d5f034ebd9c) Thanks [@roodboi](https://github.com/roodboi)! - update client types to better support non oai clients + updates to allow for passing usage properties into meta from non-oai clients

## 1.3.0

### Minor Changes

- [#176](https://github.com/instructor-ai/instructor-js/pull/176) [`6dd4255`](https://github.com/instructor-ai/instructor-js/commit/6dd42554e89d36c93132eace2dd67951297831bd) Thanks [@roodboi](https://github.com/roodboi)! - add ability to include usage from streams by teeing stream when option is present

- [#177](https://github.com/instructor-ai/instructor-js/pull/177) [`09f04d1`](https://github.com/instructor-ai/instructor-js/commit/09f04d1ff7a943679a7c49e4b20a23827cbdaae4) Thanks [@roodboi](https://github.com/roodboi)! - add new option for providing custom logger
  add new option for retrying on any error

## 1.2.1

### Patch Changes

- [#166](https://github.com/instructor-ai/instructor-js/pull/166) [`ddfe257`](https://github.com/instructor-ai/instructor-js/commit/ddfe2572c672708fb9ad20ad6726cb3af07c5148) Thanks [@roodboi](https://github.com/roodboi)! - make sure we pass through \_meta on non stream completions

## 1.2.0

### Minor Changes

- [#164](https://github.com/instructor-ai/instructor-js/pull/164) [`6942d65`](https://github.com/instructor-ai/instructor-js/commit/6942d652b7750fac4306c4d713399cdc03e86a9b) Thanks [@roodboi](https://github.com/roodboi)! - adding request option pass through + handling non validation errors a little bit better and not retrying if not validation error specifically

## 1.1.2

### Patch Changes

- [#162](https://github.com/instructor-ai/instructor-js/pull/162) [`287aa27`](https://github.com/instructor-ai/instructor-js/commit/287aa27d92450d73dd300de7e84927d94cae9220) Thanks [@roodboi](https://github.com/roodboi)! - add groq to supported providers - remove error on validation and warn instead so we dont fail if we are out of date on the mappings

## 1.1.1

### Patch Changes

- [#157](https://github.com/instructor-ai/instructor-js/pull/157) [`c272342`](https://github.com/instructor-ai/instructor-js/commit/c272342c9baa8631990afa66bcb7dafb3c81f78b) Thanks [@roodboi](https://github.com/roodboi)! - updates zod-stream dep to get control charachter filtering on teh raw stream

## 1.1.0

### Minor Changes

- [#153](https://github.com/instructor-ai/instructor-js/pull/153) [`76ef059`](https://github.com/instructor-ai/instructor-js/commit/76ef0591a1e34b73923d0c21afcf9e09e99b6b7c) Thanks [@roodboi](https://github.com/roodboi)! - updated client types to be more flexible - added tests for latest anthropic updates and llm-polyglot major

## 1.0.0

### Major Changes

- [#144](https://github.com/instructor-ai/instructor-js/pull/144) [`d0275ff`](https://github.com/instructor-ai/instructor-js/commit/d0275ff3b91d87d05a72c98001a49222e3cba348) Thanks [@roodboi](https://github.com/roodboi)! - updating all types to better support non openai clients - this changes some of the previously exported types and adds a few new ones

- [#125](https://github.com/instructor-ai/instructor-js/pull/125) [`c205286`](https://github.com/instructor-ai/instructor-js/commit/c205286dccdbc6feacfd2aeeca0e0ba449631a57) Thanks [@roodboi](https://github.com/roodboi)! - Updating zod-stream major and stream output types - this change moves the internal properties tacked onto the stream output from many \_properties to one \_meta object with the properties nested - this also adds explicit types so when used in ts projects it doesnt yell.

### Minor Changes

- [#132](https://github.com/instructor-ai/instructor-js/pull/132) [`f65672c`](https://github.com/instructor-ai/instructor-js/commit/f65672cfe443e37cb32ee721aa406ca093125ffb) Thanks [@roodboi](https://github.com/roodboi)! - adding meta to standard completions as well and including usage - also added more verbose debug logs and new provider specific transformers to handle discrepencies in various apis

## 0.0.7

### Patch Changes

- [#123](https://github.com/instructor-ai/instructor-js/pull/123) [`70d3874`](https://github.com/instructor-ai/instructor-js/commit/70d38747339a33ecca2d60c75140db3c200260fc) Thanks [@roodboi](https://github.com/roodboi)! - updating zod-stream/schema-stream to pick up on updates to enums and handling better defaults

## 0.0.6

### Patch Changes

- [#104](https://github.com/instructor-ai/instructor-js/pull/104) [`95aa27f`](https://github.com/instructor-ai/instructor-js/commit/95aa27f75a6ac719b1640eee1c48c5861573defc) Thanks [@roodboi](https://github.com/roodboi)! - explicit check for oai url vs falling through to other

## 0.0.5

### Patch Changes

- [#99](https://github.com/instructor-ai/instructor-js/pull/99) [`c9ab910`](https://github.com/instructor-ai/instructor-js/commit/c9ab9104e554e4f24b55f69cf24b784091c7bfb1) Thanks [@roodboi](https://github.com/roodboi)! - Adding explicit support for non-oai providers - currently anyscale and together ai - will do explicit checks on mode selected vs provider and model

- [#97](https://github.com/instructor-ai/instructor-js/pull/97) [`c7aec7c`](https://github.com/instructor-ai/instructor-js/commit/c7aec7c072aaa6921a30995332a9fb61938dce9d) Thanks [@roodboi](https://github.com/roodboi)! - Fixing inference on stream types when using npm or pnpm

## 0.0.4

### Patch Changes

- [#90](https://github.com/instructor-ai/instructor-js/pull/90) [`771d175`](https://github.com/instructor-ai/instructor-js/commit/771d1750361b409ed8a59adfdf79a29174b67c87) Thanks [@roodboi](https://github.com/roodboi)! - Updating build and exports for wider range of support

## 0.0.3

### Patch Changes

- [#86](https://github.com/instructor-ai/instructor-js/pull/86) [`205c6cb`](https://github.com/instructor-ai/instructor-js/commit/205c6cbc4e276b792953352e546ada356467aab5) Thanks [@roodboi](https://github.com/roodboi)! - update zodstream and schema stream to support zod defaults

- [#74](https://github.com/instructor-ai/instructor-js/pull/74) [`f93d93b`](https://github.com/instructor-ai/instructor-js/commit/f93d93b7553af81a727bd8783d18c2901bb0d11a) Thanks [@roodboi](https://github.com/roodboi)! - Type updates

## 0.0.2

### Patch Changes

- [#66](https://github.com/instructor-ai/instructor-js/pull/66) [`dc22633`](https://github.com/instructor-ai/instructor-js/commit/dc226330a57ee5b06ff1ee44a2ad7c4526f5796d) Thanks [@ethanleifer](https://github.com/ethanleifer)! - Cleanup Types, make response_model.name required and rely on inference

- [#72](https://github.com/instructor-ai/instructor-js/pull/72) [`265a9e5`](https://github.com/instructor-ai/instructor-js/commit/265a9e5fd2d8b0fdeaa98ee8b3ee3c27fa1c6a2b) Thanks [@ethanleifer](https://github.com/ethanleifer)! - Implements testing for typescript inference

## 0.0.1

### Patch Changes

- [#62](https://github.com/instructor-ai/instructor-js/pull/62) [`a939ff5`](https://github.com/instructor-ai/instructor-js/commit/a939ff5713c4b90437a73e62e83f8c713ac0a782) Thanks [@roodboi](https://github.com/roodboi)! - V0 release
