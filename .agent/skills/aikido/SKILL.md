---
name: aikido
description: Official developer guidelines and checklists for Aikido Security to integrate security, SAST, secret scanning, dependency vetting, and container policies directly into the developer workflow.
version: 1.0.0
author: Aikido Security
tags:
  - security
  - devsecops
  - secrets
  - dependencies
  - csp
---

# Skill: Aikido Security Developer Guidelines & Playbook

This playbook outlines the official integration standards and best practices for Aikido Security, promoting a "shift-left" approach to catch vulnerability risks directly within the developer workflow.

---

## 🚀 When to Activate

Trigger this skill automatically whenever you are:
1. Auditing codebase security or writing security policies (CSP, CORS, secure headers).
2. Modifying package dependencies, running package installs, or updating lockfiles.
3. Managing environment configurations, credentials, or API secret storage.
4. Integrating containerization (Docker, Kubernetes) or Cloud infrastructure (Terraform).

---

## 🛡️ 1. Developer Workflows & Shift-Left Integration

*   **PR Security Checks:** Ensure pull request security gating is active. Use inline guidance and Aikido's AI-powered Autofix suggestions to fix dependency and code vulnerabilities before merging.
*   **Malicious Package Prevention:** Use **Aikido Safe Chain** to safeguard dependency management pipelines (`npm`, `yarn`, `pnpm`, and `npx`) from dependency confusion, typosquatting, and supply chain attacks.
*   **Pipeline Automation:** Integrate security scans into CI/CD pipelines (such as GitHub Actions) to run checks automatically on push/merge, allowing teams to fail builds on high or critical vulnerabilities.

---

## 📝 2. Custom Rule Sets & Team Standards

Define custom rule checks to enforce conventions specific to your stack, business logic, or compliance requirements:

*   **Custom SAST & IaC Rules:** Write Semgrep patterns to detect custom security violations, such as insecure internal helper usages or missing tenant validation logic.
*   **Custom Code Quality Rules:** Define specific team standards using natural language. Aikido translates these into automated pull request checks.
*   **Validation Rules:** Always test your custom rules against compliant and non-compliant samples in the Opengrep playground or internal rule-builder to prevent false positives/negatives.

---

## 🔒 3. API & Cloud Security Principles

*   **API Exposure Controls:**
    *   Enforce strong token/session authentication (OAuth 2.0/OIDC) and least-privilege role bounds.
    *   Protect endpoints with request rate-limiting and structured logging.
    *   Never expose internal stack traces, database logs, or debugging outputs in production API responses.
    *   Scan OpenAPI/Swagger schemas for API misconfigurations.
*   **Container Vetting:** Build containers using minimal, verified base images (such as Alpine or distroless images) to minimize attack surface.
*   **Infrastructure as Code (IaC):** Always scan Terraform, CloudFormation, and Kubernetes manifests for misconfigured security groups, open ports, and static credentials before provisioning cloud assets.

---

## 🎯 4. Remediation & Prioritization

*   **Prioritize Reachability:** Focus efforts on issues categorized by Aikido as high-risk, exposed, or reachable in runtime execution, rather than spending cycles on theoretical or unexposed findings.
*   **Deduplication:** Leverage Aikido's built-in deduplication engine to resolve multiple occurrences of the same underlying vulnerability (e.g. across nested dependencies) with a single patch.
