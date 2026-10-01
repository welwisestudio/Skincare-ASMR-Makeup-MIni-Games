# Testing rewarded ads

Localhost (including production preview), `npm run dev` and `npm run package:adtest` grant the requested reward when the
SDK is absent or its rewarded request fails. The test archive is
`Skincare-ASMR-adtest.zip`. Receipts for these rewards start with `test-`.

A cancelled video (`false`) grants nothing. Paused or concurrent requests
are not converted into rewards.

`npm run package` builds the normal `Skincare-ASMR-web.zip`: only a successful
YouTube rewarded response grants rewards on published hosts. Localhost, 127.0.0.1
and IPv6 loopback still allow test rewards, including with this normal build.
Both package commands update `dist`; run the normal command to restore the
production preview after building the test archive.
