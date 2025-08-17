/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * privacy.tsx
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

'use client'

import * as m from '@/paraglide/messages'

// TypeScript interfaces
interface SectionProps {
  title: string;
  shortDescription?: string;
  children: React.ReactNode;
  className?: string;
  isTableOfContents?: boolean;
}

interface SubSectionProps {
  title: string;
  children: React.ReactNode;
}

interface TableSection {
  number: string;
  title: string;
}

// Helper function for creating section ids
const createSectionId = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

const TableOfContents = () => {
  const sections: TableSection[] = [
    { number: '1', title: m["privacy.sections.informationCollection.title"]() },
    { number: '2', title: m["privacy.sections.usage.title"]() },
    { number: '3', title: m["privacy.sections.dataSharingSecurity.title"]() },
    { number: '4', title: m["privacy.sections.cookiesTracking.title"]() }
  ];

  return (
    <nav className="my-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => {
          const sectionId = createSectionId(section.title);
          return (
            <a
              key={section.number}
              href={`#${sectionId}`}
              className="glass-2 rounded-lg p-4 transition-all duration-200 hover:glass-3 group"
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById(sectionId);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                  window.history.pushState({}, '', `#${sectionId}`);
                }
              }}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">{section.number}</span>
                </div>
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {section.title}
                </h3>
              </div>
            </a>
          );
        })}
      </div>
    </nav>
  );
};

// Section component with modern card design
const Section = ({ title, shortDescription, children, className, isTableOfContents = false }: SectionProps) => {
  const sectionId = createSectionId(title);
  // Extract number and actual title from title
  const titleParts = title.match(/^(\d+\.\s*)?(.+)$/);
  const actualTitle = titleParts ? titleParts[2] : title;

  return (
    <section id={sectionId} className={`mb-8 scroll-mt-20 ${className || ''}`}>
      <div className="glass-2 rounded-xl p-6 md:p-8 space-y-6">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          {isTableOfContents ? title : actualTitle}
        </h2>
        {shortDescription && (
          <div className="glass-3 rounded-lg p-4 space-y-2">
            <p className="font-semibold text-primary">Brief Description:</p>
            <p className="text-muted-foreground leading-relaxed">{shortDescription}</p>
          </div>
        )}
        <div className="space-y-4">
          {children}
        </div>
      </div>
    </section>
  );
};

const SubSection = ({ title, children }: SubSectionProps) => (
  <div className="space-y-3">
    <h3 className="text-lg md:text-xl font-semibold text-foreground">{title}</h3>
    <div className="pl-4 space-y-3">
      {children}
    </div>
  </div>
);

export default function PrivacyPage() {
  return (
    <div className='min-h-screen bg-background'>
      <div className='max-w-6xl mx-auto px-4 py-12 md:py-24'>
        {/* Header */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl md:text-5xl font-bold text-foreground mb-4'>
            {m["privacy.title"]()}
          </h1>
          <p className='text-muted-foreground text-lg mb-2'>
            {m["privacy.lastUpdated"]({ date: "July 10th, 2025" })}
          </p>
          <div className='w-24 h-1 bg-gradient-to-r from-primary to-primary/60 mx-auto rounded-full' />
        </div>

        {/* Introduction */}
        <div className='glass-2 rounded-xl p-6 md:p-8 mb-8'>
          <h2 className='text-2xl font-bold text-foreground mb-6'>{m["privacy.about.title"]()}</h2>
          <div className='space-y-4 text-muted-foreground leading-relaxed'>
            <p className="text-lg">
              {m["privacy.about.description"]()}
            </p>
            <p>
              {m["privacy.about.serviceDescription"]()}
            </p>
            <div className='space-y-3 mt-4'>
              <div className='flex items-start space-x-3'>
                <div className='w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0' />
                <p>
                  {m["privacy.about.usageScenarios.website"]({
                    websiteUrl: (
                      <a href='https://zepid.dev' className='text-primary hover:text-primary/80 transition-colors font-medium'>
                        https://libra.dev
                      </a>
                    )
                  })}
                </p>
              </div>
              <div className='flex items-start space-x-3'>
                <div className='w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0' />
                <p>{m["privacy.about.usageScenarios.platform"]()}</p>
              </div>
              <div className='flex items-start space-x-3'>
                <div className='w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0' />
                <p>{m["privacy.about.usageScenarios.interaction"]()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Questions or Concerns */}
        <div className="glass-3 rounded-xl p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-foreground">
            {m["privacy.concerns.title"]()}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {m["privacy.concerns.description"]({
              contactEmail: (
                <a
                  href="mailto:contact@libra.dev"
                  className="text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  contact@libra.dev
                </a>
              )
            })}
          </p>
        </div>

        {/* Table of Contents */}
        <Section title={m["privacy.tableOfContents.title"]()} className="mb-12">
          <TableOfContents />
        </Section>

        {/* Main Content Sections */}
        <Section
          title={`1. ${m["privacy.sections.informationCollection.title"]()}`}
          shortDescription={m["privacy.sections.informationCollection.shortDescription"]()}
        >
          <div className="space-y-6">
            <div className="glass-3 rounded-lg p-4">
              <h4 className='text-lg font-semibold mb-3 flex items-center text-foreground'>
                <span className="w-3 h-3 bg-primary rounded-full mr-3 flex-shrink-0" />
                {m["privacy.sections.informationCollection.personalInfo.title"]()}
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                {m["privacy.sections.informationCollection.personalInfo.description"]()}
              </p>
            </div>

            <div className="glass-3 rounded-lg p-4">
              <h4 className='text-lg font-semibold mb-3 flex items-center text-foreground'>
                <span className="w-3 h-3 bg-primary rounded-full mr-3 flex-shrink-0" />
                {m["privacy.sections.informationCollection.usageData.title"]()}
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                {m["privacy.sections.informationCollection.usageData.description"]()}
              </p>
            </div>

            <div className="glass-3 rounded-lg p-4">
              <h4 className='text-lg font-semibold mb-3 flex items-center text-foreground'>
                <span className="w-3 h-3 bg-primary rounded-full mr-3 flex-shrink-0" />
                {m["privacy.sections.informationCollection.contentData.title"]()}
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                {m["privacy.sections.informationCollection.contentData.description"]()}
              </p>
            </div>
          </div>
        </Section>

        <Section
          title={`2. ${m["privacy.sections.usage.title"]()}`}
          shortDescription={m["privacy.sections.usage.shortDescription"]()}
        >
          <p className='mb-6 text-muted-foreground leading-relaxed'>
            {m["privacy.sections.usage.description"]()}
          </p>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <span className="w-3 h-3 bg-primary rounded-full mt-1 flex-shrink-0" />
              <p className="text-muted-foreground leading-relaxed">{m["privacy.sections.usage.purposes.platform"]()}</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="w-3 h-3 bg-primary rounded-full mt-1 flex-shrink-0" />
              <p className="text-muted-foreground leading-relaxed">{m["privacy.sections.usage.purposes.personalization"]()}</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="w-3 h-3 bg-primary rounded-full mt-1 flex-shrink-0" />
              <p className="text-muted-foreground leading-relaxed">{m["privacy.sections.usage.purposes.communication"]()}</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="w-3 h-3 bg-primary rounded-full mt-1 flex-shrink-0" />
              <p className="text-muted-foreground leading-relaxed">{m["privacy.sections.usage.purposes.security"]()}</p>
            </div>
          </div>
        </Section>

        <Section
          title={`3. ${m["privacy.sections.dataSharingSecurity.title"]()}`}
          shortDescription={m["privacy.sections.dataSharingSecurity.shortDescription"]()}
        >
          <div className="space-y-6">
            <div className="glass-3 rounded-lg p-4">
              <h4 className="text-lg font-semibold mb-3 flex items-center text-foreground">
                <span className="w-3 h-3 bg-primary rounded-full mr-3 flex-shrink-0" />
                {m["privacy.sections.dataSharingSecurity.noMarketing.title"]()}
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                {m["privacy.sections.dataSharingSecurity.noMarketing.description"]()}
              </p>
            </div>

            <div className="glass-3 rounded-lg p-4">
              <h4 className="text-lg font-semibold mb-3 flex items-center text-foreground">
                <span className="w-3 h-3 bg-primary rounded-full mr-3 flex-shrink-0" />
                {m["privacy.sections.dataSharingSecurity.trustedProviders.title"]()}
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                {m["privacy.sections.dataSharingSecurity.trustedProviders.description"]()}
              </p>
            </div>

            <div className="glass-3 rounded-lg p-4">
              <h4 className="text-lg font-semibold mb-3 flex items-center text-foreground">
                <span className="w-3 h-3 bg-primary rounded-full mr-3 flex-shrink-0" />
                {m["privacy.sections.dataSharingSecurity.securityMeasures.title"]()}
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                {m["privacy.sections.dataSharingSecurity.securityMeasures.description"]()}
              </p>
            </div>
          </div>
        </Section>

        <Section
          title={`4. ${m["privacy.sections.cookiesTracking.title"]()}`}
          shortDescription={m["privacy.sections.cookiesTracking.shortDescription"]()}
        >
          <p className="mb-6 text-muted-foreground leading-relaxed">
            {m["privacy.sections.cookiesTracking.description"]()}
          </p>

          <SubSection title={m["privacy.sections.cookiesTracking.analyticsTools.title"]()}>
            <p className="mb-4 text-muted-foreground leading-relaxed">
              {m["privacy.sections.cookiesTracking.analyticsTools.description"]()}
            </p>
            <div className="space-y-4">
              <div className="glass-3 rounded-lg p-4">
                <h5 className="font-semibold text-foreground mb-2">{m["privacy.sections.cookiesTracking.analyticsTools.ga4.title"]()}</h5>
                <p className="text-muted-foreground leading-relaxed">
                  {m["privacy.sections.cookiesTracking.analyticsTools.ga4.description"]()}
                </p>
              </div>
              <div className="glass-3 rounded-lg p-4">
                <h5 className="font-semibold text-foreground mb-2">{m["privacy.sections.cookiesTracking.analyticsTools.posthog.title"]()}</h5>
                <p className="text-muted-foreground leading-relaxed">
                  {m["privacy.sections.cookiesTracking.analyticsTools.posthog.description"]()}
                </p>
              </div>
            </div>
          </SubSection>

          <p className="mt-6 text-muted-foreground leading-relaxed">
            {m["privacy.sections.cookiesTracking.conclusion"]()}
          </p>
        </Section>

        {/* Contact and Updates */}
        <div className="space-y-8">
          <Section title={m["privacy.contact.title"]()}>
            <p className="text-muted-foreground leading-relaxed">
              {m["privacy.contact.description"]({
                contactEmail: (
                  <a
                    href="mailto:contact@libra.dev"
                    className="text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    contact@libra.dev
                  </a>
                )
              })}
            </p>
          </Section>

          <Section title={m["privacy.updates.title"]()}>
            <p className="text-muted-foreground leading-relaxed">
              {m["privacy.updates.description"]()}
            </p>
          </Section>
        </div>

        {/* Closing Statement */}
        <div className="glass-3 rounded-xl p-6 md:p-8 text-center">
          <p className="text-muted-foreground leading-relaxed">
            {m["privacy.closing.statement"]()}
          </p>
        </div>
      </div>
    </div>
  )
}