export const SUPPORT_EMAIL = "esim@uplisoft.com";

export type LegalSection = {
  title: string;
  paragraphs: string[];
};

export type LegalDocument = {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
};

export const termsDocument = {
  title: "Terms of Service",
  lastUpdated: "May 9, 2026",
  sections: [
    {
      title: "Agreement",
      paragraphs: [
        'By creating an account or using Velocity eSIM ("the App"), you agree to these Terms. If you do not agree, do not use the App. We may update these Terms; continued use after changes means you accept the revised Terms.'
      ]
    },
    {
      title: "The service",
      paragraphs: [
        "Velocity eSIM helps you discover, purchase, activate, and manage prepaid mobile data plans using compatible eSIM-capable devices. Plans are provided by third-party mobile operators or aggregators we integrate with. Availability, coverage, speeds, and pricing depend on those networks and may change without notice."
      ]
    },
    {
      title: "Eligibility & accounts",
      paragraphs: [
        "You must be able to form a binding contract in your jurisdiction, typically 18 or older. You agree to provide accurate information, including phone number verification via OTP where required, and to keep your device and passcodes secure. You are responsible for activity under your account except where prohibited by law."
      ]
    },
    {
      title: "Acceptable use",
      paragraphs: [
        "Do not misuse the App, including fraud, interfering with systems, reverse engineering where prohibited, reselling access without authorization, or violating export or sanctions laws. We may suspend or terminate access for violations or risk to users or partners."
      ]
    },
    {
      title: "Fees & purchases",
      paragraphs: [
        "Prices shown in the App are determined at checkout. Taxes or carrier fees may apply. Unless stated otherwise, plans are prepaid and non-refundable once activated or delivered according to the plan's terms. Chargebacks or payment disputes may affect your ability to use the service."
      ]
    },
    {
      title: "Connectivity disclaimer",
      paragraphs: [
        "Mobile data depends on operator networks, roaming arrangements, device compatibility, local regulation, and radio conditions. We do not guarantee uninterrupted service, specific speeds, or coverage in every location."
      ]
    },
    {
      title: "Intellectual property",
      paragraphs: [
        "The App, branding, and content are owned by Velocity eSIM or licensors and protected by applicable laws. You receive a limited, revocable license to use the App for personal, non-commercial use unless otherwise agreed."
      ]
    },
    {
      title: "Limitation of liability",
      paragraphs: [
        "To the maximum extent permitted by law, Velocity eSIM is not liable for indirect, incidental, special, consequential, or punitive damages, or loss of profits, data, or goodwill arising from use of the App or third-party connectivity services. Some jurisdictions do not allow certain limitations; in those cases our liability is limited to the fullest extent permitted."
      ]
    },
    {
      title: "Contact",
      paragraphs: [`Questions about these Terms: contact support through channels provided in the App or at ${SUPPORT_EMAIL}.`]
    }
  ]
} satisfies LegalDocument;

export const policyDocument = {
  title: "Privacy Policy",
  lastUpdated: "May 9, 2026",
  sections: [
    {
      title: "Overview",
      paragraphs: [
        'Velocity eSIM ("we", "us") respects your privacy. This Policy describes how we collect, use, store, and share personal information when you use our mobile application and related services to browse, purchase, activate, and manage prepaid travel eSIM data plans.'
      ]
    },
    {
      title: "Information we collect",
      paragraphs: [
        "Account & verification: phone number, one-time passcodes, and related authentication signals needed to secure your account.",
        "Profile & usage: app interactions, device type, OS version, app version, diagnostics, and crash data to keep the service reliable.",
        "Transaction data: plan purchases, payment references, activation timestamps, and carrier identifiers needed to deliver connectivity.",
        "Support communications: messages you send to support and metadata needed to respond.",
        "Optional biometrics: if you enable device biometrics, biometric templates stay on your device; we do not receive your raw biometric data."
      ]
    },
    {
      title: "How we use information",
      paragraphs: [
        "We use personal data to provide and improve the App; verify identity; process purchases and activations; detect fraud and abuse; comply with law; communicate service messages; and analyze aggregated usage to improve performance and features. We do not sell your personal information."
      ]
    },
    {
      title: "Sharing",
      paragraphs: [
        "We share information with mobile operators and technical partners as needed to provision data plans; with payment processors for transactions; with infrastructure and analytics providers under contracts that limit use; and when required by law, court order, or to protect rights and safety. If Velocity eSIM is involved in a merger or acquisition, information may transfer subject to this Policy or equivalent protections."
      ]
    },
    {
      title: "Retention",
      paragraphs: [
        "We retain data only as long as needed for the purposes above, legal obligations, dispute resolution, and enforcing agreements. Retention periods vary by data category and jurisdiction."
      ]
    },
    {
      title: "Security",
      paragraphs: [
        "We use administrative, technical, and organizational measures designed to protect personal information. No method of transmission or storage is completely secure; use strong device passcodes and keep your OS updated."
      ]
    },
    {
      title: "Your choices & rights",
      paragraphs: [
        "Depending on where you live, you may have rights to access, correct, delete, or export personal data, or to object to or restrict certain processing. Contact us to exercise rights; we may verify your request. You may disable optional analytics where the App provides controls."
      ]
    },
    {
      title: "International transfers",
      paragraphs: [
        "We may process data in countries where we or our partners operate. Where required, we use appropriate safeguards for cross-border transfers."
      ]
    },
    {
      title: "Children",
      paragraphs: [
        "The App is not directed at children under 13 or the minimum age in your region. We do not knowingly collect personal information from children; contact us if you believe we have, and we will take appropriate steps."
      ]
    },
    {
      title: "Changes",
      paragraphs: [
        "We may update this Policy and will post the new date at the top. Material changes may be communicated through the App or email where appropriate."
      ]
    },
    {
      title: "Contact",
      paragraphs: [`Privacy questions or requests: use in-app support or contact us at ${SUPPORT_EMAIL}.`]
    }
  ]
} satisfies LegalDocument;
