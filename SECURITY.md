# Security Policy

The Brazen team takes the security of our smart contracts, off-chain settlement infrastructure, and user funds seriously.

## Supported Versions

| Component | Version | Supported |
|---|---|---|
| Soroban Contracts (`source_vault`, `dest_pool`) | `0.1.x` | :white_check_mark: |
| Relayer Infrastructure | `0.1.x` | :white_check_mark: |
| Frontend Web App | `0.1.x` | :white_check_mark: |

---

## Reporting a Vulnerability

If you discover a potential vulnerability or security issue within the Brazen protocol:

1. **Do not create a public GitHub issue.**
2. Send an email to the security team with detailed steps to reproduce the vulnerability, code snippets, and transaction traces if available:
   - **Email:** `security@brazenlabs.org` (or submit a confidential security advisory via GitHub Security Advisories tab on `Brazen-labs/brazen`).
3. Include the following details in your report:
   - Description of the potential exploit and attack vector.
   - Severity assessment (e.g. Critical, High, Medium, Low).
   - Component affected (`contracts`, `relayer`, `frontend`, or `dependencies`).
   - Proof of concept (PoC) code or steps to reproduce.
   - Any remediation suggestions you may have.

---

## Security Response Process

- **Acknowledgement:** We will acknowledge receipt of your report within 24 hours.
- **Assessment & Triaging:** Our engineering and contract auditing team will triage and assess the reported issue within 48 hours.
- **Fix & Deployment:** We will prepare a patched release, audit the patch, and coordinate deployment or emergency pause actions if necessary.
- **Public Disclosure:** A coordinated public security disclosure and post-mortem will be published after the fix has been applied and verified.

---

## Responsible Disclosure & Bounties

We believe in responsible disclosure and will credit security researchers in release notes and disclosure advisories once resolved.
