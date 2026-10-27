# Optional ecosystem integration fixtures

The ecosystem repositories exist locally but their packages are not yet on npm.
Private, licensed workspace snapshots in `vendor/` make browser tests reproducible
without publishing or depending on paths outside this repository. Each snapshot
records its source revision. The library's npm tarball excludes this directory
and declares only Virtual Core and the Vibe.js peer dependency.

Vibecn components are copied into the playground from its source registry, with
`vibecn.LICENSE`. They are owned by the example application. No virtual-* registry
installation command is offered. VibeDND has no implementation to test.
