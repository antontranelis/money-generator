# Claude Code Instructions

## NPM Publishing

**NEVER publish directly to npm using `npm publish`.**

To publish a new version:
1. Update the version in `package.json`
2. Build with `npm run build:lib`
3. Commit the changes with a descriptive message
4. Create an **annotated** git tag with release notes:
   ```bash
   git tag -a v<version> -m "Release v<version>

   ## Changes
   - Feature/fix description 1
   - Feature/fix description 2
   "
   ```
5. Push to GitHub with tags: `git push && git push --tags`

The GitHub Actions workflow will automatically publish to npm and create a GitHub Release when a version tag is pushed. The tag message becomes the release notes.
