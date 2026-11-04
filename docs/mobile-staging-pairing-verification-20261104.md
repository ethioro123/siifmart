# Mobile staging quick login — 4 November 2026

Quick login previously required a loopback hostname in the client and a loopback peer/Host/Origin on the development middleware. A phone opening the Mac's private Wi-Fi IP therefore could not use it.

Development staging now accepts literal RFC1918 IPv4 hosts as pairing candidates. Privileged accounts/session routes still reject unpaired devices. Production builds and production project URLs do not enable this UI; the middleware is registered only for the exact staging project.

The localhost login screen can generate a single-use eight-digit pairing code. A phone enters it on the private-IP staging login page. Codes expire in five minutes and permit at most eight attempts before a new local code is needed. Successful pairing sets an HttpOnly SameSite=Strict cookie, bound server-side to peer IP and Host, valid for two hours. Pairing state is memory-only, bounded to eight devices and cleared on server restart. Codes and device cookies are not logged or added to URLs, files or browser storage. Existing fixture-account restrictions remain in force. The roster is not requested until the server confirms pairing.

The pairing prompt was verified in the running development app through its private Wi-Fi address. Localhost was still in its existing authentication/data loading state during browser inspection; local code-generation controls and phone entry were separately exercised by component tests. No real quick-login session was generated as a browser test.

Twenty-two targeted tests passed covering production/public/cross-origin denial, private host parsing, device/Host binding, code reuse, expiry/attempt limits, restart revocation, roster gating, test-account restrictions and the UI controls. TypeScript, whitespace and file-size checks passed. No database, Edge Function or production configuration change was required.
