/**
 * FAQ Section
 * Frequently asked questions
 */

'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
  {
    question: 'Is Dorisio secure?',
    answer:
      'Yes, Dorisio uses Stellar blockchain technology with enterprise-grade security. All transactions are verified and immutable. Your wallet is secured with industry-standard encryption.',
  },
  {
    question: 'What is USDC and why use it?',
    answer:
      'USDC is a stablecoin pegged to the US Dollar. It provides the stability of fiat currency with the speed and security of blockchain. No volatility, no transaction fees during settlement.',
  },
  {
    question: 'How do creators get paid?',
    answer:
      'Creators connect their Stellar wallet and tips are instantly settled to their account. They can withdraw to their preferred exchange or bank account anytime. Minimum withdrawal is $10 USDC.',
  },
  {
    question: 'Are there any fees?',
    answer:
      'For supporters: Zero fees on tips. For creators: 2% platform fee on each tip received. This helps us maintain and improve the platform.',
  },
  {
    question: 'How do I verify as a creator?',
    answer:
      'Complete identity verification in your creator dashboard. Upload a government-issued ID and a selfie. Verification takes 24-48 hours. This ensures only authentic creators can receive tips.',
  },
  {
    question: 'Can I support international creators?',
    answer:
      'Yes! USDC on Stellar enables truly global payments. Support creators anywhere in the world instantly. The only requirement is they have a Stellar wallet.',
  },
  {
    question: 'What happens if a transaction fails?',
    answer:
      'Failed transactions are automatically retried. If it still fails, the USDC is refunded to your wallet within 24 hours. You can also contact our support team for assistance.',
  },
  {
    question: 'How do I contact support?',
    answer:
      "Email us at support@dorisio.io or use the chat widget in the app. Response time is typically under 2 hours during business hours. We're here to help!",
  },
];

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border rounded-lg hover:border-primary transition-smooth">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-4 p-4 md:p-6 text-left hover:bg-accent/50 transition-smooth"
      >
        <h3 className="font-semibold text-base md:text-lg flex-1">{question}</h3>
        <ChevronDown
          className={cn('w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform', {
            'rotate-180': isOpen,
          })}
        />
      </button>

      {isOpen && (
        <div className="border-t border-border px-4 md:px-6 py-4 md:py-6 text-muted-foreground animate-slide-down">
          {answer}
        </div>
      )}
    </div>
  );
}

export function FAQSection(): JSX.Element {
  return (
    <section id="faq" className="py-20 md:py-32 bg-background">
      <div className="container-tight space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about Dorisio
          </p>
        </div>

        {/* FAQ Items */}
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>

        {/* Still have questions */}
        <div className="text-center pt-12 space-y-4">
          <p className="text-muted-foreground">Still have questions?</p>
          <a
            href="mailto:support@dorisio.io"
            className="text-primary hover:underline font-semibold"
          >
            Get in touch with our support team →
          </a>
        </div>
      </div>
    </section>
  );
}
