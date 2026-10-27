# Third-party notices

VibeVirtual is MIT licensed. It uses the public Vibe.js runtime as an external peer
and TanStack Virtual Core 3.19.8 as an external dependency. No React, Vue, Solid or
Svelte runtime code is included in the library. The lifecycle design follows the
supported adapter protocol shown by TanStack's official adapters.

## TanStack Virtual

Source: https://github.com/TanStack/virtual

MIT License

Copyright (c) 2021-present Tanner Linsley

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Development workbench

Vibecn source components are adapted from shadcn/ui and Vibe.js contributors;
their complete MIT notices ship in `examples/playground/vibecn.LICENSE`.
Private ecosystem fixtures retain their own LICENSE and THIRD-PARTY-NOTICES.md
under `integrations/vendor`. They are excluded from the library tarball.

Geist and Geist Mono are self-hosted through Fontsource, under SIL Open Font
License 1.1. Full notices ship in `examples/playground/licenses`. Marked (MIT),
Motion (MIT), TanStack Query/Table/Store (MIT), and Shiki (MIT) are workbench or
development tooling dependencies with their licenses in the dependency packages.
No font or UI asset is included in the VibeVirtual library tarball.
