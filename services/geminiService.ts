
import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are the built-in AI Security Assistant of C-Force AI.
Your role is to help users understand scan results, security risks, and recommended mitigations in a clear, professional, and ethical way.

Core responsibilities:
- Explain scan results in simple, human-readable language.
- Help users understand: What each vulnerability means, Why it matters, How risky it is.
- Provide defensive and remediation guidance only.

Strict rules:
- Do NOT provide: Exploits, Payloads, Attack instructions, Brute-force techniques, or any step-by-step hacking guidance.
- You MAY provide: Security best practices, Configuration recommendations, Patch and update advice, Defensive mitigation steps, References to public documentation (OWASP, NIST, CVE).

Response style:
- Professional SOC / Cyber analyst tone.
- Clear and concise.
- No fear-mongering.
- No unnecessary jargon.
- Structured answers with bullet points when helpful.

Legal & ethical notice: Assume the user is scanning systems they own or have permission to test. Always encourage responsible and legal security practices.`;

export async function askSecurityAssistant(query: string, history: ChatMessage[], context: any) {
  const contextStr = context ? `CURRENT_SCAN_CONTEXT: ${JSON.stringify(context)}` : "NO_SCAN_CONTEXT_AVAILABLE";
  
  const contents = [
    ...history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })),
    {
      role: 'user',
      parts: [{ text: `${contextStr}\n\nUSER_QUERY: ${query}` }]
    }
  ];

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: contents as any,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
      topP: 0.95,
      thinkingConfig: { thinkingBudget: 0 }
    }
  });

  return response.text;
}

/**
 * [MODULE_MODE: ISOLATED] [OSINT_UNIT]
 * [STATELESS] [NO_SHARED_CONTEXT] [IGNORE_ALL_OTHER_SECTIONS] [NO_CROSS_MODULE_UPDATE]
 * OSINT Intelligence Gathering Engine.
 */
export async function gatherOSINT(target: string) {
  const prompt = `[MODULE_MODE: ISOLATED]
[STATELESS]
[NO_SHARED_CONTEXT]
[IGNORE_ALL_OTHER_SECTIONS]
[NO_CROSS_MODULE_UPDATE]

YOU ARE THE OSINT INTELLIGENCE GATHERING MODULE ONLY.
You operate completely independently from all other modules.

Target: ${target}

Scope:
Strictly Open Source Intelligence (OSINT).
Publicly available information only.
No scanning. No probing. No exploitation.

Tasks:
- Collect domain information and DNS records (publicly available)
- Gather WHOIS and registration details
- Identify ownership and organization (if public)
- Resolve IP address(es) and basic geolocation
- Detect hosting provider, ISP, ASN, and CDN/WAF presence
- Identify web server, technologies, CMS, and frameworks (public indicators only)
- Collect known subdomains from public sources
- Identify related domains and infrastructure (if publicly linked)
- Gather SSL/TLS certificate details (issuer, validity, transparency logs)
- Collect publicly indexed URLs and directories (search-engine based)
- Identify exposed metadata or public files (if indexed)
- Gather historical data (domain age, past DNS, reputation)
- Check public security reputation and blacklist mentions
- Collect social, organizational, and digital footprint references (if available)

OUTPUT FORMAT (STRICT JSON ONLY):
{
  "target": "${target}",
  "executiveSummary": "Summary of findings",
  "domainProfile": {
    "domain": "...",
    "registrar": "...",
    "creationDate": "...",
    "expiryDate": "...",
    "ownership": "...",
    "dnsRecords": "..."
  },
  "infrastructureProfile": {
    "ipAddresses": ["..."],
    "geolocation": "...",
    "hosting": "...",
    "asn": "...",
    "waf": "..."
  },
  "techStackOverview": ["...", "..."],
  "exposedAssets": {
    "subdomains": ["..."],
    "indexedUrls": ["..."],
    "publicFiles": ["..."]
  },
  "historicalIntelligence": "Historical data and reputation summary",
  "observations": ["Point 1", "Point 2"],
  "disclaimer": "DISCLAIMER: This is an OSINT-based passive analysis only. No active probing was performed."
}

RESTRICTIONS:
Do NOT perform active scanning or enumeration.
Do NOT attempt authentication or exploitation.
Do NOT read from or write to any other module.
Do NOT modify or update any section outside this module.
Do NOT store or reuse results globally.

STRICT RULE: RETURN ONLY THE JSON OBJECT. NO CHAT.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 0 }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("OSINT Parse Error:", response.text);
    throw new Error("Failed to parse OSINT data");
  }
}

/**
 * [MODULE_MODE: ISOLATED] [IP_TRACE_NETWORK_OSINT_INTELLIGENCE]
 * [STATELESS] [NO_SHARED_CONTEXT] [IGNORE_ALL_OTHER_SECTIONS] [NO_CROSS_MODULE_UPDATE]
 * IP Trace & Network OSINT Engine.
 */
export async function exploreCountryIPs(target: string) {
  const prompt = `[MODULE_MODE: ISOLATED]
[STATELESS]
[NO_SHARED_CONTEXT]
[IGNORE_ALL_OTHER_SECTIONS]
[NO_CROSS_MODULE_UPDATE]

YOU ARE THE IP TRACE & NETWORK OSINT INTELLIGENCE MODULE ONLY.
You operate completely independently from all other modules.

Target Country: ${target}

CRITICAL TASK: 
Identify and list ALL primary IP ranges (CIDR blocks) allocated to ${target} that are visible on the public internet. 
You must compile a comprehensive list of network segments representing the country's total IP space.

Scope:
- Strictly Open Source Intelligence (OSINT).
- Publicly available information only.
- No scanning. No probing. No packet inspection. No exploitation.

Tasks:
- Identify all publicly registered ASNs associated with ${target}
- COLLECT ALL OFFICIAL IP RANGES (CIDR BLOCKS) allocated to the country. Provide a long, detailed list.
- Identify major ISPs, telecom providers, and hosting companies
- Map ASN ownership and organization details (public records only)
- Determine IP geolocation confidence (registry-based)
- Detect international transit providers and upstream connections
- Identify CDN, cloud, and global providers operating in the country
- Gather public BGP routing information and prefix announcements

OUTPUT FORMAT (STRICT JSON ONLY):
{
  "target": "${target}",
  "executiveSummary": "Summary of country network intelligence",
  "networkOverview": {
    "totalAsns": "Count",
    "ipAllocationsCount": "Number of CIDR blocks identified",
    "totalIpCount": "Estimated total number of individual IPs",
    "connectivityScore": "Assessment"
  },
  "allCountryIpRanges": [
     "CIDR_RANGE_1 (e.g., 1.2.3.0/24)",
     "CIDR_RANGE_2",
     "..."
  ],
  "asnMapping": [
    {
      "asn": "ASN_ID",
      "organization": "Company Name",
      "ranges": ["CIDR_1", "CIDR_2"],
      "type": "ISP | GOVERNMENT | COMMERCIAL"
    }
  ],
  "ispProfile": [
    {
      "name": "Provider Name",
      "marketShare": "Estimated significance",
      "services": "Types of services provided"
    }
  ],
  "infrastructure": {
    "ixps": ["Major Exchange Points"],
    "transitProviders": ["Upstream Providers"],
    "cloudProviders": ["Local/Global cloud nodes"]
  },
  "reputation": {
    "abuseRating": "General reputation",
    "blacklistStats": "Summary of known malicious segments"
  },
  "observations": ["Significant finding 1", "Significant finding 2"],
  "disclaimer": "DISCLAIMER: This is an OSINT-based passive analysis only. No network probing was performed."
}

RESTRICTIONS:
Do NOT perform active scanning.
Do NOT discover private user IPs.
STRICT RULE: RETURN ONLY THE JSON OBJECT. NO CHAT.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 0 }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("IP Explorer Parse Error:", response.text);
    throw new Error("Failed to parse IP Trace data");
  }
}

/**
 * [MODULE_MODE: ISOLATED] [WEBSITE_FULL_SECURITY_VULNERABILITY_SCAN]
 * [STATELESS] [NO_SHARED_CONTEXT] [IGNORE_ALL_OTHER_SECTIONS] [NO_CROSS_MODULE_UPDATE]
 * Comprehensive Passive Vulnerability Intelligence Engine.
 */
export async function scanVulnerabilities(target: string) {
  const prompt = `[MODULE_MODE: ISOLATED]
[STATELESS]
[NO_SHARED_CONTEXT]
[IGNORE_ALL_OTHER_SECTIONS]
[NO_CROSS_MODULE_UPDATE]

YOU ARE THE WEBSITE FULL SECURITY & VULNERABILITY SCAN MODULE ONLY.
You operate completely independently from all other modules.

Target: ${target}

Scope:
Strictly passive, OSINT-based, and threat-intelligence-driven analysis.
No active scanning. No exploitation. No intrusive actions.

Tasks:
- Identify domain and resolved IP address(es)
- Detect hosting provider, ISP, country, ASN, and IP type
- Analyze web server type and publicly visible HTTP headers
- Check TLS/SSL presence and high-level configuration
- Identify CMS, frameworks, libraries, platforms, and technology stack
- Estimate commonly exposed ports and related services (no active scan)
- Detect WAF/CDN and security headers

Comprehensive Vulnerability Intelligence:
- Enumerate ALL publicly known vulnerabilities related to detected technologies
- Cover web server, CMS, plugins, frameworks, libraries, TLS, and common services
- Reference relevant CVEs and vulnerability advisories when applicable
- Classify vulnerabilities by category (e.g., RCE, XSS, SQLi, Misconfiguration)
- Include CVSS score or severity level if publicly available
- Provide high-level exploitation description (conceptual only, non-operational)
- Provide detailed remediation, mitigation, and hardening recommendations
- Identify if vulnerabilities are likely mitigated by WAF/CDN or configuration
- Use only public vulnerability intelligence sources

OUTPUT FORMAT (STRICT JSON ONLY):
{
  "target": "${target}",
  "serverIp": "RESOLVED_IP",
  "status": "EXECUTIVE_SUMMARY_OF_RISK (e.g., CRITICAL_EXPOSURE, STABLE, etc.)",
  "exposureSummary": "Narrative executive summary and overall risk posture.",
  "riskAssessment": "Final detailed risk assessment based on findings.",
  "disclaimer": "DISCLAIMER: This is an OSINT-based passive analysis only. No active probing was performed.",
  "technicalProfile": {
    "hosting": "...",
    "isp": "...",
    "asn": "...",
    "server": "...",
    "techStack": ["...", "..."],
    "tlsConfig": "...",
    "waf": "..."
  },
  "openPorts": [
    {
      "port": 80,
      "service": "http",
      "version": "Detected Version",
      "info": "Technical notes"
    }
  ],
  "vulnerabilities": [
    {
      "id": "CVE-YYYY-XXXX",
      "title": "Technical Name of Finding",
      "type": "RCE | XSS | SQLi | MISCONFIGURATION | EXPOSURE",
      "severity": "LOW | MEDIUM | HIGH | CRITICAL",
      "cvss": "Numeric Score",
      "affectedComponent": "CMS Plugin / Library / etc.",
      "description": "Technical description of the vulnerability.",
      "exploitInfo": "High-level conceptual exploitation overview.",
      "remediation": "Detailed remediation guidance.",
      "mitigatedByWaf": "Yes/No/Likely"
    }
  ],
  "hardeningRecommendations": [
    "Specific technical recommendation 1",
    "Specific technical recommendation 2"
  ]
}

STRICT RULE: RETURN ONLY THE JSON OBJECT. NO CHAT.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 0 }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse scan result:", response.text);
    throw new Error("Invalid scan engine response");
  }
}
