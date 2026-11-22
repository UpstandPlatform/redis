# Releasing to npm

## One-time initial staged publication

The first version is staged by an authorized maintainer and approved manually before
GitHub Actions is allowed to publish later versions. The npm organization that owns the
`@upstand` scope must exist, and your npm account needs write access to the package.
Enable 2FA on the npm account used to approve the stage. Staged publishing requires
Node.js 22.14.0 or newer and npm 11.15.0 or newer.

From the current `main` checkout, verify the npm account and package contents:

```sh
npm whoami
npm run pack:check
npm stage publish --access public
```

The current `main` package version is `0.2.5`. Find and review the staged version:

```sh
npm stage list @upstand/redis
npm stage view <stage-id>
npm stage download <stage-id>
```

Approve it with your npm account's 2FA challenge, replacing `<stage-id>` with the ID
shown by `npm stage list`:

```sh
npm stage approve <stage-id>
```

When staging a package that does not exist yet, npm makes a `0.0.0-stage` placeholder
version public. The staged `0.2.5` contents remain unavailable until approval. The
staged local publication does not carry GitHub Actions provenance; later releases from
the trusted publisher will.

## Configure npm trusted publishing

After `@upstand/redis` exists on npm, open its **Settings → Trusted Publisher** section
and add a GitHub Actions publisher with these exact values:

- GitHub organization/user: `UpstandPlatform`
- Repository: `redis`
- Workflow filename: `release.yml`
- Environment: `npm-release`

For allowed actions, enable **npm publish**. The release workflow's
`changesets/action` runs `changeset publish`, which calls `npm publish`; a publisher
configured only for `npm stage publish` will not authorize this workflow. New npm
publisher configurations default to staged publishing, so explicitly allow direct
publishing for the current workflow.

The release job already grants `id-token: write`, uses GitHub-hosted runners, Node.js
22.14.0, and npm 11.7.0, and selects the `npm-release` GitHub environment. The package's
repository URL uses GitHub's canonical case (`UpstandPlatform/redis`), which must match
the repository used for provenance. Do not add an npm token to the repository or
GitHub secrets; trusted publishing uses short-lived OIDC credentials and automatically
generates provenance.

A new npm trusted publisher must complete its first successful publish within two days
of configuration. After configuring it, merge the open Changesets release PR to publish
`@upstand/redis@1.0.0` through GitHub Actions. If that two-day window expires, delete the
publisher configuration, add it again, and complete a successful publish within the new
window.

## Subsequent releases

1. Add a Changeset describing the public change.
2. Merge the Changesets version pull request created by `release.yml`.
3. The next push to `main` runs the release gate and publishes the version through npm
   trusted publishing.

The workflow validates linting, types, tests, build output, declaration packaging,
`publint`, `arethetypeswrong`, tarball imports, and npm audit before Changesets is
allowed to version or publish the package.
