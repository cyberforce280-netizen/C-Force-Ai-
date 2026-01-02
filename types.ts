
export enum Severity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface Vulnerability {
  id: string;
  title: string;
  severity: Severity;
  description: string;
  vector: string;
  exploitInfo: string;
  remediation: string;
  patchingSteps: string[];
  reference?: string;
}

export interface InfoGathering {
  general: {
    domain: string;
    url: string;
    siteType: string;
    language: string;
  };
  hosting: {
    ip: string;
    provider: string;
    location: string;
    serverType: string;
  };
  techStack: {
    languages: string[];
    frameworks: string[];
    cms: string;
    database?: string;
  };
  structure: {
    importantPages: string[]; // Login, Admin, API
    sensitiveFiles: string[]; // robots.txt, sitemap.xml
    internalLinksCount: number;
  };
  security: {
    httpsEnabled: boolean;
    sslCertType: string;
    firewall: string; // Cloudflare, WAF
    errorMessagesVisible: boolean;
  };
  metadata: {
    htmlComments: string[];
    jsCssFiles: string[];
    hiddenPaths: string[];
  };
  linkedAccounts: {
    socialMedia: string[];
    emails: string[];
    contactFormFound: boolean;
  };
  history: {
    creationDate: string;
    lastUpdate: string;
    status: 'Active' | 'Abandoned' | 'Maintenance';
  };
  toolOutputs: {
    whois: string;
    nslookup: string[];
    nmapPassive: string[];
    googleDorks: string[];
  };
}

export interface ScanResult {
  target: string;
  ip: string;
  timestamp: string;
  openPorts: string[];
  vulnerabilities: Vulnerability[];
  infoGathering: InfoGathering;
  metrics: {
    totalFindings: number;
    criticalCount: number;
    securityScore: number;
    sslStatus?: string;
  };
}

export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}
