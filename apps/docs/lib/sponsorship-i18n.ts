/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * sponsorship-i18n.ts
 * Copyright (C) 2025 Nextify Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 *
 */

export interface SponsorshipTexts {
  platinum: {
    title: string;
    description: string;
    buttonText: string;
    tagline: string;
    benefits: {
      title: string;
      items: string[];
    };
    demo: {
      title: string;
      description: string;
      logoPlaceholder: string;
      websiteLink: string;
      ctaText: string;
    };
  };
  gold: {
    title: string;
    description: string;
    buttonText: string;
    benefits: {
      title: string;
      items: string[];
    };
    demo: {
      title: string;
      description: string;
      logoPlaceholder: string;
      websiteLink: string;
    };
  };
  silver: {
    title: string;
    description: string;
    buttonText: string;
    benefits: {
      title: string;
      items: string[];
    };
    demo: {
      title: string;
      description: string;
      logoPlaceholder: string;
      websiteLink: string;
    };
  };
  bronze: {
    title: string;
    description: string;
    buttonText: string;
    benefits: {
      title: string;
      items: string[];
    };
    demo: {
      title: string;
      description: string;
      badgeText: string;
      communitySection: string;
    };
  };
}

export const sponsorshipTexts: Record<string, SponsorshipTexts> = {
  en: {
    platinum: {
      title: "💎 PLATINUM SPONSORS",
      description: "Join our Platinum tier to showcase your company with maximum visibility. Your logo, description, and custom messaging will be prominently featured across all Libra documentation and marketing materials.",
      buttonText: "Become a Platinum Sponsor",
      tagline: "Empowering developers to build the future",
      benefits: {
        title: "Platinum Tier Benefits",
        items: [
          "Premium logo placement on homepage",
          "Dedicated sponsor showcase section",
          "Custom messaging and company description",
          "Priority support and direct communication",
          "Early access to new features and beta testing",
          "Co-marketing opportunities and case studies"
        ]
      },
      demo: {
        title: "Preview: Maximum Visibility Showcase",
        description: "Your company will receive the highest level of visibility with dedicated showcase space and premium placement.",
        logoPlaceholder: "Your Company Logo",
        websiteLink: "Visit your-company.com",
        ctaText: "Learn More About Our Platform"
      }
    },
    gold: {
      title: "🥇 GOLD SPONSORS",
      description: "Join our Gold tier sponsors and showcase your company to thousands of developers using Zepid AI. Featured logo placement with company description and direct website link.",
      buttonText: "Become a Gold Sponsor",
      benefits: {
        title: "Gold Tier Benefits",
        items: [
          "Featured logo placement",
          "Company description",
          "Direct website link",
          "Priority support"
        ]
      },
      demo: {
        title: "Preview: Featured Sponsor Showcase",
        description: "Your company will be prominently featured in our Gold tier with logo, description, and direct link.",
        logoPlaceholder: "Your Company Logo",
        websiteLink: "Visit demo-company.com"
      }
    },
    silver: {
      title: "🥈 SILVER SPONSORS",
      description: "Display your corporate logo in the sponsor showcase area with a direct link to your official website or product page.",
      buttonText: "Become a Silver Sponsor",
      benefits: {
        title: "Silver Tier Benefits",
        items: [
          "Logo placement in sponsor section",
          "Direct website link",
          "Community recognition",
          "GitHub sponsor badge"
        ]
      },
      demo: {
        title: "Preview: How Your Sponsorship Appears",
        description: "Your company logo will be prominently displayed in our documentation with a direct link to your website.",
        logoPlaceholder: "Your Company Logo",
        websiteLink: "Visit your-company.com"
      }
    },
    bronze: {
      title: "🥉 BRONZE SPONSORS",
      description: "Get recognized in the community sponsor section with your corporate logo and official website link.",
      buttonText: "Become a Bronze Sponsor",
      benefits: {
        title: "Bronze Tier Benefits",
        items: [
          "Community recognition",
          "Logo in sponsor section",
          "Website link",
          "GitHub sponsor badge"
        ]
      },
      demo: {
        title: "Preview: Community Recognition",
        description: "Your support will be acknowledged in our community sponsor section.",
        badgeText: "Community Sponsor",
        communitySection: "Community Sponsors"
      }
    }
  },
  zh: {
    platinum: {
      title: "💎 白金级赞助商",
      description: "加入我们的白金级赞助商，享受最高级别的品牌曝光。您的企业标识、详细介绍和定制信息将在所有 Libra 文档和营销材料中获得突出展示。",
      buttonText: "成为白金级赞助商",
      tagline: "赋能开发者构建未来",
      benefits: {
        title: "白金级权益",
        items: [
          "首页顶级logo展示位置",
          "专属赞助商展示区域",
          "定制化信息和企业介绍",
          "优先技术支持和直接沟通",
          "新功能抢先体验和内测资格",
          "联合营销机会和案例研究"
        ]
      },
      demo: {
        title: "预览：最高级别曝光展示",
        description: "您的企业将获得最高级别的品牌曝光，享有专属展示空间和顶级展示位置。",
        logoPlaceholder: "您的企业Logo",
        websiteLink: "访问 your-company.com",
        ctaText: "了解更多关于我们的平台"
      }
    },
    gold: {
      title: "🥇 黄金级赞助商",
      description: "加入我们的黄金级赞助商，向数千名使用 Zepid AI 的开发者展示您的企业。享受特色logo展示位置，包含企业介绍和官网直链。",
      buttonText: "成为黄金级赞助商",
      benefits: {
        title: "黄金级权益",
        items: [
          "特色logo展示位置",
          "企业详细介绍",
          "官网直接链接",
          "优先技术支持"
        ]
      },
      demo: {
        title: "预览：特色赞助商展示",
        description: "您的企业将在黄金级赞助商区域获得突出展示，包含logo、介绍和直接链接。",
        logoPlaceholder: "您的企业Logo",
        websiteLink: "访问 demo-company.com"
      }
    },
    silver: {
      title: "🥈 白银级赞助商",
      description: "在赞助商展示区显示企业标识，并提供直接链接到您的官网或产品页面。",
      buttonText: "成为白银级赞助商",
      benefits: {
        title: "白银级权益",
        items: [
          "赞助商区域logo展示",
          "官网直接链接",
          "社区认可",
          "GitHub赞助商徽章"
        ]
      },
      demo: {
        title: "您的赞助展示效果",
        description: "您的企业logo将在我们的文档中突出显示，并提供直接链接到您的网站。",
        logoPlaceholder: "您的企业Logo",
        websiteLink: "访问 your-company.com"
      }
    },
    bronze: {
      title: "🥉 青铜级赞助商",
      description: "在社区赞助商版块获得认可，展示企业标识和官网链接。",
      buttonText: "成为青铜级赞助商",
      benefits: {
        title: "青铜级权益",
        items: [
          "社区认可",
          "赞助商区域logo展示",
          "官网链接",
          "GitHub赞助商徽章"
        ]
      },
      demo: {
        title: "预览：社区认可展示",
        description: "您的支持将在我们的社区赞助商版块中得到认可。",
        badgeText: "社区赞助商",
        communitySection: "社区赞助商"
      }
    }
  }
};

export function getSponsorshipTexts(locale = 'en'): SponsorshipTexts {
  const texts = sponsorshipTexts[locale];
  if (texts) {
    return texts;
  }
  // Fallback to English, which is guaranteed to exist
  return sponsorshipTexts.en as SponsorshipTexts;
}
