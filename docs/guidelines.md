
# Contribution Guidelines

This document outlines the process and guidelines for contributing to this project, which uses Bun & Typescript.

## Environment Setup

### Prerequisites

- Ensure you have the correct versions of all required runtimes/tools. This project uses a `.tool-versions` file at the root of the repository. If you have [asdf](https://asdf-vm.com/) (a universal version manager), it should automatically pick up the required versions.

### Installation

1. **Install Dependencies**:
   Run the following command to install the project dependencies:

```bash
bun install
```


2. **Environment Variables**:
Copy the `.example.env` file to `.env` and fill in the necessary values for the OpenAI and Anyscale keys.

### Code Quality Tools

- This project uses ESLint and Prettier for code formatting and quality checks.
- Prettier is integrated with ESLint, so it's recommended to use an ESLint plugin in your IDE.
- For Visual Studio Code or Cursor users: Project-level settings are configured to enable ESLint autosave. 

The IDE should prompt you to install recommended plugins.

*Note: If using the Prettier plugin, ensure it's disabled to avoid conflicts.

### Running Tests

- Execute tests using the following command:

```bash
bun test
```


## Making Contributions

### Pull Requests (PRs)

- Keep PRs focused and scoped to specific changes.
- Provide detailed descriptions in your PRs. Screenshots or videos are excellent ways to enhance communication.

### Source Code Changes

- If your PR includes changes to the source code, include a `changeset`.
- Changesets help manage and automate versioning.
- Create a changeset by running `bun changeset` at the root of the project and following the prompts.
- Be descriptive in the changeset as it will be included in the changelog for the next release.
- Choose `patch`, `minor`, or `major` for your changeset depending on the type of change.
- Commit the changeset file (an auto-generated markdown file describing the changes). This will trigger a CI action once merged and stack the change on top of any existing ones in preparation for the next release.

For more information on changesets, visit: [Changesets GitHub Repository](https://github.com/changesets/changesets)

---

## Community and Support

- Join our community on Discord: [Join Discord](https://discord.gg/CbfxwgHA6y)
- Reach out on Twitter: [@dimitrikennedy](https://twitter.com/dimitrikennedy)[@jxnlco](https://twitter.com/jxnlco)
