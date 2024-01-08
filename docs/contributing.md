We would love for you to contribute to `Instructor-js`.

## Migrating Docs from Python

Theres a bunch of examples in the python version, including documentation here [python docs](https://jxnl.github.io/instructor/examples/)

If you want to contribute, please check out [issues](https://github.com/instructor-ai/instructor-js/issues/8)

## Issues

If you find a bug, please file an issue on [our issue tracker on GitHub](https://github.com/instructor-ai/instructor-js/issues).

To help us reproduce the bug, please provide a minimal reproducible example, including a code snippet and the full error message.

1. The `response_model` you are using.
2. The `messages` you are using.
3. The `model` you are using.

---

# Contribution Guidelines

This projectuses Bun & Typescript.

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





### Pull Requests

We welcome pull requests! There is plenty to do, and we are happy to discuss any contributions you would like to make.

If it is not a small change, please start by [filing an issue](https://github.com/instructor-ai/instructor-js/issues) first.

If you need ideas, you can check out the [help wanted](https://github.com/instructor-ai/instructor-js/labels/help%20wanted) or [good first issue](https://github.com/instructor-ai/instructor-js/labels/good%20first%20issue) labels.



### Source Code Changes

- If your PR includes changes to the source code, include a `changeset`.
- Changesets help manage and automate versioning.
- Create a changeset by running `bun changeset` at the root of the project and following the prompts.
- Be descriptive in the changeset as it will be included in the changelog for the next release.
- Choose `patch`, `minor`, or `major` for your changeset depending on the type of change.
- Commit the changeset file (an auto-generated markdown file describing the changes). This will trigger a CI action once merged and stack the change on top of any existing ones in preparation for the next release.

For more information on changesets, visit: [Changesets GitHub Repository](https://github.com/changesets/changesets)


## Community and Support

- Join our community on Discord: [Join Discord](https://discord.gg/CbfxwgHA6y)
- Reach out on Twitter: [@dimitrikennedy](https://twitter.com/dimitrikennedy) [@jxnlco](https://twitter.com/jxnlco)

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

<a href="https://github.com/jxnl/instructor/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=instructor-ai/instructor-js" />
</a>


## Additional Resources
Python is required to run the documentation locally using mkdocs.

To enhance your understanding of the documentation, here are some useful references:

- **mkdocs serve:** The `mkdocs serve` command is used to preview your documentation locally during the development phase. When you run this command in your terminal, MkDocs starts a development server, allowing you to view and interact with your documentation in a web browser. This is helpful for checking how your changes look before publishing the documentation. Learn more in the [mkdocs serve documentation](https://www.mkdocs.org/commands/serve/).

- **hl_lines in Code Blocks:** The `hl_lines` feature in code blocks allows you to highlight specific lines within the code block. This is useful for drawing attention to particular lines of code when explaining examples or providing instructions. You can specify the lines to highlight using the `hl_lines` option in your code block configuration. For more details and examples, you can refer to the [hl_lines documentation](https://www.mkdocs.org/user-guide/writing-your-docs/#syntax-highlighting).

- **Admonitions:** Admonitions are a way to visually emphasize or call attention to certain pieces of information in your documentation. They come in various styles, such as notes, warnings, tips, etc. Admonitions provide a structured and consistent way to present important content. For usage examples and details on incorporating admonitions into your documentation, you can refer to the [admonitions documentation](https://www.mkdocs.org/user-guide/writing-your-docs/#admonitions).

For more details about the documentation structure and features, refer to the [MkDocs Material documentation](https://squidfunk.github.io/mkdocs-material/).
  
Thank you for your contributions, and happy coding!