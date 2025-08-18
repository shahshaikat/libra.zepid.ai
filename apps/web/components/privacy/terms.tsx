/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * terms.tsx
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

import { useId } from 'react'
import * as m from '@/paraglide/messages'

// TypeScript interfaces
interface ListProps {
  items: (string | React.ReactNode)[];
  className?: string;
  type?: 'disc' | 'decimal' | 'none';
}

interface SectionProps {
  number?: string;
  title: string;
  children: React.ReactNode;
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
    .replace(/^-|-$/g, '')
}

// List component for reuse
const List = ({ items, className = '', type = 'disc' }: ListProps) => {
  const listId = useId();
  return (
    <ul className={`list-${type} pl-6 space-y-2 ${className}`}>
      {items.map((item, index) => (
        <li key={`${listId}-${index}`} className='text-base'>
          {item}
        </li>
      ))}
    </ul>
  );
}

// Table of Contents component
const TableOfContents = () => {
  const sections: TableSection[] = [
    { number: '1', title: m["terms.sections.ourServices.title"]() },
    { number: '2', title: m["terms.sections.intellectualProperty.title"]() },
    { number: '3', title: m["terms.sections.userRepresentations.title"]() },
    { number: '4', title: m["terms.sections.userRegistration.title"]() },
    { number: '5', title: m["terms.sections.purchasesPayment.title"]() },
    { number: '6', title: m["terms.sections.subscriptions.title"]() },
    { number: '7', title: m["terms.sections.prohibitedActivities.title"]() },
    { number: '8', title: m["terms.sections.userGeneratedContributions.title"]() },
    { number: '9', title: m["terms.sections.contributionLicense.title"]() },
    { number: '10', title: m["terms.sections.socialMedia.title"]() },
    { number: '11', title: m["terms.sections.thirdPartyWebsites.title"]() },
    { number: '12', title: m["terms.sections.servicesManagement.title"]() },
    { number: '13', title: m["terms.sections.privacyPolicy.title"]() },
    { number: '14', title: m["terms.sections.copyrightInfringements.title"]() },
    { number: '15', title: m["terms.sections.termTermination.title"]() },
    { number: '16', title: m["terms.sections.modificationsInterruptions.title"]() },
    { number: '17', title: m["terms.sections.governingLaw.title"]() },
    { number: '18', title: m["terms.sections.disputeResolution.title"]() },
    { number: '19', title: m["terms.sections.corrections.title"]() },
    { number: '20', title: m["terms.sections.disclaimer.title"]() },
    { number: '21', title: m["terms.sections.limitationsLiability.title"]() },
    { number: '22', title: m["terms.sections.indemnification.title"]() },
    { number: '23', title: m["terms.sections.userData.title"]() },
    { number: '24', title: m["terms.sections.electronicCommunications.title"]() },
    { number: '25', title: m["terms.sections.californiaUsers.title"]() },
    { number: '26', title: m["terms.sections.miscellaneous.title"]() },
    { number: '27', title: m["terms.contact.title"]() },
  ]

  return (
    <nav className='my-8'>
      <ol className='list-decimal pl-6 space-y-2'>
        {sections.map((section) => {
          const sectionId = createSectionId(section.title)
          return (
            <li key={section.number}>
              <a
                href={`#${sectionId}`}
                className='text-blue-600 hover:text-blue-800 hover:underline'
                onClick={(e) => {
                  e.preventDefault()
                  const element = document.getElementById(sectionId)
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' })
                    window.history.pushState({}, '', `#${sectionId}`)
                  }
                }}
              >
                {section.title}
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// Section component
const Section = ({ number, title, children }: SectionProps) => {
  const sectionId = createSectionId(title)
  return (
    <section id={sectionId} className='mb-12 scroll-mt-16'>
      <h2 className='text-2xl font-bold mb-4'>
        {number && `${number}. `}
        {title}
      </h2>
      {children}
    </section>
  )
}

// SubSection component
const SubSection = ({ title, children }: SubSectionProps) => (
  <div className='mb-6'>
    <h3 className='text-xl font-semibold mb-2'>{title}</h3>
    {children}
  </div>
)

export default function TermsPage() {
  return (
    <div className='min-h-screen bg-background'>
      <div className='max-w-6xl mx-auto px-4 py-12 md:py-24'>
        {/* Header */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl md:text-5xl font-bold text-foreground mb-4'>
            {m["terms.title"]()}
          </h1>
          <p className='text-muted-foreground text-lg mb-2'>
            {m["terms.lastUpdated"]({ date: "July 10th, 2025" })}
          </p>
          <div className='w-24 h-1 bg-gradient-to-r from-primary to-primary/60 mx-auto rounded-full' />
        </div>

        {/* Introduction */}
        <div className='glass-2 rounded-xl p-6 md:p-8 mb-8'>
          <h2 className='text-2xl font-bold mb-6 text-foreground'>{m["terms.agreement.title"]()}</h2>
          <div className='space-y-4 text-muted-foreground leading-relaxed'>
            <p>
              {m["terms.agreement.description"]()}
            </p>
            <p>
              {m["terms.agreement.serviceDescription"]({
                websiteUrl: (
                  <a href='https://zepid.dev' className='text-primary hover:text-primary/80 transition-colors font-medium'>
                    https://zepid.dev
                  </a>
                )
              })}
            </p>
            <div className='glass-3 rounded-lg p-4 mt-4'>
              <p className='font-semibold text-foreground'>
                {m["terms.agreement.warning"]()}
              </p>
            </div>
          </div>
        </div>

        {/* Table of Contents */}
        <Section title={m["terms.tableOfContents.title"]()}>
          <TableOfContents />
        </Section>

        {/* Main Content Sections */}
        <Section number='1' title={m["terms.sections.ourServices.title"]()}>
          <p className='mb-4'>
            {m["terms.sections.ourServices.content.paragraph1"]()}
          </p>
          <p className='mb-4'>
            {m["terms.sections.ourServices.content.paragraph2"]()}
          </p>
        </Section>

        <Section number='2' title={m["terms.sections.intellectualProperty.title"]()}>
          <SubSection title={m["terms.sections.intellectualProperty.ourPropertyTitle"]()}>
            <p className='mb-4'>
              {m["terms.sections.intellectualProperty.ourPropertyParagraph1"]()}
            </p>
            <p className='mb-4'>
              {m["terms.sections.intellectualProperty.ourPropertyParagraph2"]()}
            </p>
            <p className='mb-4'>
              {m["terms.sections.intellectualProperty.ourPropertyParagraph3"]()}
            </p>
          </SubSection>

          <SubSection title={m["terms.sections.intellectualProperty.yourUseTitle"]()}>
            <p className='mb-4'>
              {m["terms.sections.intellectualProperty.yourUseParagraph1"]()}
            </p>
            <List
              items={[
                m["terms.sections.intellectualProperty.yourUseList1"](),
                m["terms.sections.intellectualProperty.yourUseList2"](),
              ]}
              className='mb-4'
            />
          </SubSection>
        </Section>

        <Section number='3' title={m["terms.sections.userRepresentations.title"]()}>
          <p className='mb-4'>{m["terms.sections.userRepresentations.intro"]()}</p>
          <List
            items={[
              m["terms.sections.userRepresentations.list1"](),
              m["terms.sections.userRepresentations.list2"](),
              m["terms.sections.userRepresentations.list3"](),
              m["terms.sections.userRepresentations.list4"](),
              m["terms.sections.userRepresentations.list5"](),
              m["terms.sections.userRepresentations.list6"](),
              m["terms.sections.userRepresentations.list7"](),
            ]}
            className='mb-4'
          />
          <p className='mb-4'>
            {m["terms.sections.userRepresentations.conclusion"]()}
          </p>
        </Section>

        <Section number='4' title={m["terms.sections.userRegistration.title"]()}>
          <p className='mb-4'>
            {m["terms.sections.userRegistration.paragraph1"]()}
          </p>
        </Section>

        <Section number='5' title={m["terms.sections.purchasesPayment.title"]()}>
          <p className='mb-4'>{m["terms.sections.purchasesPayment.paymentIntro"]()}</p>
          <List items={[
            m["terms.sections.purchasesPayment.paymentVisa"](),
            m["terms.sections.purchasesPayment.paymentMastercard"](),
            m["terms.sections.purchasesPayment.paymentAmex"](),
            m["terms.sections.purchasesPayment.paymentStripe"]()
          ]} className='mb-6' />

          <p className='mb-4'>
            {m["terms.sections.purchasesPayment.paragraph1"]()}
          </p>

          <p className='mb-4'>
            {m["terms.sections.purchasesPayment.paragraph2"]()}
          </p>
        </Section>

        <Section number='6' title={m["terms.sections.subscriptions.title"]()}>
          <SubSection title={m["terms.sections.subscriptions.billingTitle"]()}>
            <p className='mb-4'>
              {m["terms.sections.subscriptions.billingParagraph1"]()}
            </p>
            <p className='mb-4'>
              {m["terms.sections.subscriptions.billingParagraph2"]()}
            </p>
          </SubSection>

          <SubSection title={m["terms.sections.subscriptions.cancellationTitle"]()}>
            <p className='mb-4'>
              {m["terms.sections.subscriptions.cancellationParagraph1"]()}
            </p>
            <p className='mb-4'>
              {m["terms.sections.subscriptions.cancellationParagraph2"]()}
            </p>
          </SubSection>

          <SubSection title={m["terms.sections.subscriptions.feeChangesTitle"]()}>
            <p className='mb-4'>
              {m["terms.sections.subscriptions.feeChangesParagraph1"]()}
            </p>
          </SubSection>
        </Section>
        <Section number='7' title={m["terms.sections.prohibitedActivities.title"]()}>
          <p className='mb-4'>
            {m["terms.sections.prohibitedActivities.intro1"]()}
          </p>

          <p className='mb-4'>{m["terms.sections.prohibitedActivities.intro2"]()}</p>

          <List
            items={[
              m["terms.sections.prohibitedActivities.list1"](),
              m["terms.sections.prohibitedActivities.list2"](),
              m["terms.sections.prohibitedActivities.list3"](),
              m["terms.sections.prohibitedActivities.list4"](),
              m["terms.sections.prohibitedActivities.list5"](),
              m["terms.sections.prohibitedActivities.list6"](),
              m["terms.sections.prohibitedActivities.list7"](),
              m["terms.sections.prohibitedActivities.list8"](),
              m["terms.sections.prohibitedActivities.list9"](),
              m["terms.sections.prohibitedActivities.list10"](),
            ]}
            className='mb-6'
          />
        </Section>

        <Section number='8' title={m["terms.sections.userGeneratedContributions.title"]()}>
          <p className='mb-4'>
            {m["terms.sections.userGeneratedContributions.paragraph1"]()}
          </p>
          <p className='mb-4'>
            {m["terms.sections.userGeneratedContributions.paragraph2"]()}
          </p>

          <List
            items={[
              m["terms.sections.userGeneratedContributions.warrantyList1"](),
              m["terms.sections.userGeneratedContributions.warrantyList2"](),
              m["terms.sections.userGeneratedContributions.warrantyList3"](),
              m["terms.sections.userGeneratedContributions.warrantyList4"](),
              m["terms.sections.userGeneratedContributions.warrantyList5"](),
              m["terms.sections.userGeneratedContributions.warrantyList6"](),
              m["terms.sections.userGeneratedContributions.warrantyList7"](),
              m["terms.sections.userGeneratedContributions.warrantyList8"](),
              m["terms.sections.userGeneratedContributions.warrantyList9"](),
              m["terms.sections.userGeneratedContributions.warrantyList10"](),
            ]}
            className='mb-6'
          />
          <p className='mb-4'>
            {m["terms.sections.userGeneratedContributions.conclusion"]()}
          </p>
        </Section>

        <Section number='9' title={m["terms.sections.contributionLicense.title"]()}>
          <p className='mb-4'>
            {m["terms.sections.contributionLicense.paragraph1"]()}
          </p>

          <p className='mb-4'>
            {m["terms.sections.contributionLicense.paragraph2"]()}
          </p>

          <p className='mb-4'>
            {m["terms.sections.contributionLicense.paragraph3"]()}
          </p>

          <p className='mb-4'>
            {m["terms.sections.contributionLicense.paragraph4"]()}
          </p>
        </Section>

        <Section number='10' title={m["terms.sections.socialMedia.title"]()}>
          <p className='mb-4'>
            {m["terms.sections.socialMedia.paragraph1"]()}
          </p>

          <p className='mb-4'>
            {m["terms.sections.socialMedia.paragraph2"]()}
          </p>

          <List
            items={[
              m["terms.sections.socialMedia.list1"](),
              m["terms.sections.socialMedia.list2"](),
            ]}
            className='mb-4'
          />
        </Section>
        <Section number='11' title={m["terms.sections.thirdPartyWebsites.title"]()}>
          <p className='mb-4'>
            {m["terms.sections.thirdPartyWebsites.paragraph1"]()}
          </p>

          <p className='mb-4'>
            {m["terms.sections.thirdPartyWebsites.paragraph2"]()}
          </p>

          <p className='mb-4'>
            {m["terms.sections.thirdPartyWebsites.paragraph3"]()}
          </p>
        </Section>

        <Section number='12' title={m["terms.sections.servicesManagement.title"]()}>
          <p className='mb-4'>{m["terms.sections.servicesManagement.intro"]()}</p>
          <List
            items={[
              m["terms.sections.servicesManagement.list1"](),
              m["terms.sections.servicesManagement.list2"](),
              m["terms.sections.servicesManagement.list3"](),
              m["terms.sections.servicesManagement.list4"](),
              m["terms.sections.servicesManagement.list5"](),
            ]}
            className='mb-6'
          />
        </Section>

        <Section number='13' title={m["terms.sections.privacyPolicy.title"]()}>
          <p className='mb-4'>
            {m["terms.sections.privacyPolicy.paragraph1"]()}
          </p>

          <p className='mb-4'>
            {m["terms.sections.privacyPolicy.paragraph2"]()}
          </p>
        </Section>

        <Section number='14' title={m["terms.sections.copyrightInfringements.title"]()}>
          <p className='mb-4'>
            {m["terms.sections.copyrightInfringements.paragraph1"]()}
          </p>

          <p className='mb-4'>
            {m["terms.sections.copyrightInfringements.paragraph2"]()}
          </p>
        </Section>

        <Section number='15' title={m["terms.sections.termTermination.title"]()}>
          <p className='mb-4'>
            {m["terms.sections.termTermination.paragraph1"]()}
          </p>

          <p className='mb-4'>
            {m["terms.sections.termTermination.paragraph2"]()}
          </p>
        </Section>
        <Section number='16' title={m["terms.sections.modificationsInterruptions.title"]()}>
          <p className='mb-4'>
            {m["terms.sections.modificationsInterruptions.paragraph1"]()}
          </p>

          <p className='mb-4'>
            {m["terms.sections.modificationsInterruptions.paragraph2"]()}
          </p>
        </Section>

        <Section number='17' title={m["terms.sections.governingLaw.title"]()}>
          <p className='mb-4'>
            {m["terms.sections.governingLaw.paragraph1"]()}
          </p>
        </Section>

        <Section number='18' title={m["terms.sections.disputeResolution.title"]()}>
          <SubSection title={m["terms.sections.disputeResolution.informalNegotiationsTitle"]()}>
            <p className='mb-4'>
              {m["terms.sections.disputeResolution.informalNegotiationsParagraph"]()}
            </p>
          </SubSection>

          <SubSection title={m["terms.sections.disputeResolution.bindingArbitrationTitle"]()}>
            <p className='mb-4'>
              {m["terms.sections.disputeResolution.bindingArbitrationParagraph"]()}
            </p>
          </SubSection>

          <SubSection title={m["terms.sections.disputeResolution.restrictionsTitle"]()}>
            <p className='mb-4'>
              {m["terms.sections.disputeResolution.restrictionsParagraph"]()}
            </p>
          </SubSection>
        </Section>

        <Section number='19' title={m["terms.sections.corrections.title"]()}>
          <p className='mb-4'>
            {m["terms.sections.corrections.paragraph1"]()}
          </p>
        </Section>

        <Section number='20' title={m["terms.sections.disclaimer.title"]()}>
          <p className='mb-4'>
            {m["terms.sections.disclaimer.content"]()}
          </p>
        </Section>

        <Section number='21' title={m["terms.sections.limitationsLiability.title"]()}>
          <p className='mb-4 uppercase'>
            {m["terms.sections.limitationsLiability.content"]()}
          </p>
        </Section>

        {/* Contact Information */}
        <Section number='22' title={m["terms.sections.indemnification.title"]()}>
          <p className='mb-4'>
            {m["terms.sections.indemnification.paragraph1"]()}
          </p>

          <List
            items={[
              m["terms.sections.indemnification.list1"](),
              m["terms.sections.indemnification.list2"](),
              m["terms.sections.indemnification.list3"](),
              m["terms.sections.indemnification.list4"](),
              m["terms.sections.indemnification.list5"](),
              m["terms.sections.indemnification.list6"](),
            ]}
            className='mb-4'
          />

          <p className='mb-4'>
            {m["terms.sections.indemnification.paragraph2"]()}
          </p>
        </Section>

        <Section number='23' title={m["terms.sections.userData.title"]()}>
          <p className='mb-4'>
            {m["terms.sections.userData.paragraph1"]()}
          </p>

          <p className='mb-4'>
            {m["terms.sections.userData.paragraph2"]()}
          </p>
        </Section>

        <Section number='24' title={m["terms.sections.electronicCommunications.title"]()}>
          <p className='mb-4'>
            {m["terms.sections.electronicCommunications.paragraph1"]()}
          </p>

          <p className='mb-4 uppercase font-semibold'>
            {m["terms.sections.electronicCommunications.paragraph2"]()}
          </p>

          <p className='mb-4'>
            {m["terms.sections.electronicCommunications.paragraph3"]()}
          </p>
        </Section>

        <Section number='25' title={m["terms.sections.californiaUsers.title"]()}>
          <p className='mb-4'>
            {m["terms.sections.californiaUsers.paragraph1"]()}
          </p>
        </Section>

        <Section number='26' title={m["terms.sections.miscellaneous.title"]()}>
          <p className='mb-4'>
            {m["terms.sections.miscellaneous.paragraph1"]()}
          </p>

          <p className='mb-4'>
            {m["terms.sections.miscellaneous.paragraph2"]()}
          </p>

          <p className='mb-4'>
            {m["terms.sections.miscellaneous.paragraph3"]()}
          </p>

          <p className='mb-4'>
            {m["terms.sections.miscellaneous.paragraph4"]()}
          </p>

          <p className='mb-4'>
            {m["terms.sections.miscellaneous.paragraph5"]()}
          </p>
        </Section>

        <Section number='27' title={m["terms.contact.title"]()}>
          <p className='mb-4 text-muted-foreground leading-relaxed'>
            {m["terms.contact.description"]()}
          </p>

          <div className='glass-3 rounded-lg p-6'>
            <address className='not-italic'>
              <p className='font-bold text-foreground'>{m["terms.contact.companyName"]()}</p>
              <p className='mt-2'>
                <a
                  href='mailto:contact@zepid.dev'
                  className='text-primary hover:text-primary/80 transition-colors font-medium'
                >
                  contact@zepid.dev
                </a>
              </p>
            </address>
          </div>
        </Section>
      </div>
    </div>
  )
}
