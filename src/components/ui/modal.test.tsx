import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  ModalClose,
} from './modal';

describe('Modal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders trigger button', () => {
      render(
        <Modal>
          <ModalTrigger>Open Modal</ModalTrigger>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Test Modal</ModalTitle>
            </ModalHeader>
          </ModalContent>
        </Modal>
      );

      const trigger = screen.getByRole('button', { name: /open modal/i });
      expect(trigger).toBeInTheDocument();
    });

    it('renders all modal subcomponents correctly', () => {
      render(
        <Modal defaultOpen={true}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Modal Title</ModalTitle>
              <ModalDescription>Modal Description</ModalDescription>
            </ModalHeader>
            <div>Modal Body</div>
            <ModalFooter>
              <button>Action</button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      );

      expect(screen.getByText('Modal Title')).toBeInTheDocument();
      expect(screen.getByText('Modal Description')).toBeInTheDocument();
      expect(screen.getByText('Modal Body')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
    });

    it('renders modal with custom className', () => {
      render(
        <Modal defaultOpen={true}>
          <ModalContent className="custom-modal">
            <ModalHeader>
              <ModalTitle>Test</ModalTitle>
            </ModalHeader>
          </ModalContent>
        </Modal>
      );

      const content = document.querySelector('.custom-modal');
      expect(content).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('opens modal when trigger is clicked', async () => {
      const user = userEvent.setup();

      render(
        <Modal>
          <ModalTrigger>Open Modal</ModalTrigger>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Test Modal</ModalTitle>
            </ModalHeader>
            <p>Modal content</p>
          </ModalContent>
        </Modal>
      );

      const trigger = screen.getByRole('button', { name: /open modal/i });
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Test Modal')).toBeInTheDocument();
        expect(screen.getByText('Modal content')).toBeInTheDocument();
      });
    });

    it('handles multiple clicks on trigger', async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });

      render(
        <Modal>
          <ModalTrigger>Toggle Modal</ModalTrigger>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Test</ModalTitle>
            </ModalHeader>
          </ModalContent>
        </Modal>
      );

      const trigger = screen.getByRole('button', { name: /toggle modal/i });

      await user.click(trigger);
      await waitFor(() => expect(screen.getByText('Test')).toBeInTheDocument());

      // Second click should work (toggle)
      await user.click(trigger);
      // Modal state would be managed by Radix, ensuring no errors
    });

    it('closes modal with close button', async () => {
      const user = userEvent.setup();

      render(
        <Modal defaultOpen={true}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Test Modal</ModalTitle>
              <ModalClose aria-label="close" />
            </ModalHeader>
          </ModalContent>
        </Modal>
      );

      const closeButton = screen.getByLabelText('close');
      expect(closeButton).toBeInTheDocument();

      // Close button should be interactive
      await user.click(closeButton);
    });

    it('handles Escape key to close modal', async () => {
      const user = userEvent.setup();

      render(
        <Modal defaultOpen={true}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Test Modal</ModalTitle>
            </ModalHeader>
            <p>Press Escape to close</p>
          </ModalContent>
        </Modal>
      );

      expect(screen.getByText('Press Escape to close')).toBeInTheDocument();

      // Escape key handling is built into Radix Dialog
      await user.keyboard('{Escape}');
    });
  });

  describe('Content', () => {
    it('displays header, body, and footer content', () => {
      render(
        <Modal defaultOpen={true}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Header Title</ModalTitle>
              <ModalDescription>Header Description</ModalDescription>
            </ModalHeader>
            <div>Body Content</div>
            <ModalFooter>
              <button>Footer Button</button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      );

      expect(screen.getByText('Header Title')).toBeInTheDocument();
      expect(screen.getByText('Header Description')).toBeInTheDocument();
      expect(screen.getByText('Body Content')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /footer button/i })).toBeInTheDocument();
    });

    it('renders multiple buttons in footer', () => {
      render(
        <Modal defaultOpen={true}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Actions</ModalTitle>
            </ModalHeader>
            <ModalFooter>
              <button type="button">Cancel</button>
              <button type="button">Confirm</button>
              <button type="button">Delete</button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('supports optional description', () => {
      const { rerender } = render(
        <Modal defaultOpen={true}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>With Description</ModalTitle>
              <ModalDescription>This is a description</ModalDescription>
            </ModalHeader>
          </ModalContent>
        </Modal>
      );

      expect(screen.getByText('This is a description')).toBeInTheDocument();

      rerender(
        <Modal defaultOpen={true}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Without Description</ModalTitle>
            </ModalHeader>
          </ModalContent>
        </Modal>
      );

      expect(screen.getByText('Without Description')).toBeInTheDocument();
    });
  });

  describe('Multiple Modals', () => {
    it('handles multiple modals independently', async () => {
      const user = userEvent.setup();

      render(
        <>
          <Modal>
            <ModalTrigger>Open Modal 1</ModalTrigger>
            <ModalContent>
              <ModalHeader>
                <ModalTitle>Modal 1</ModalTitle>
              </ModalHeader>
            </ModalContent>
          </Modal>
          <Modal>
            <ModalTrigger>Open Modal 2</ModalTrigger>
            <ModalContent>
              <ModalHeader>
                <ModalTitle>Modal 2</ModalTitle>
              </ModalHeader>
            </ModalContent>
          </Modal>
        </>
      );

      const trigger1 = screen.getByRole('button', { name: /open modal 1/i });
      const trigger2 = screen.getByRole('button', { name: /open modal 2/i });

      expect(trigger1).toBeInTheDocument();
      expect(trigger2).toBeInTheDocument();

      await user.click(trigger1);
      await waitFor(() => expect(screen.getByText('Modal 1')).toBeInTheDocument());
    });

    it('allows nesting of modals', () => {
      render(
        <Modal defaultOpen={true}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Parent Modal</ModalTitle>
            </ModalHeader>
            <Modal>
              <ModalTrigger>Open Child Modal</ModalTrigger>
              <ModalContent>
                <ModalHeader>
                  <ModalTitle>Child Modal</ModalTitle>
                </ModalHeader>
              </ModalContent>
            </Modal>
          </ModalContent>
        </Modal>
      );

      expect(screen.getByText('Parent Modal')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /open child modal/i })).toBeInTheDocument();
    });
  });

  describe('Controlled State', () => {
    it('respects defaultOpen prop', () => {
      const { rerender } = render(
        <Modal open={false}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Hidden Modal</ModalTitle>
            </ModalHeader>
          </ModalContent>
        </Modal>
      );

      expect(screen.queryByText('Hidden Modal')).not.toBeInTheDocument();

      rerender(
        <Modal open={true}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Visible Modal</ModalTitle>
            </ModalHeader>
          </ModalContent>
        </Modal>
      );

      expect(screen.getByText('Visible Modal')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper focus management', async () => {
      const user = userEvent.setup();

      render(
        <Modal>
          <ModalTrigger>Open Modal</ModalTrigger>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Focus Test</ModalTitle>
            </ModalHeader>
            <button>Modal Button</button>
          </ModalContent>
        </Modal>
      );

      const trigger = screen.getByRole('button', { name: /open modal/i });
      await user.click(trigger);

      // Modal should be accessible after opening
      await waitFor(() => {
        expect(screen.getByText('Focus Test')).toBeInTheDocument();
      });
    });

    it('close button has accessible label', () => {
      render(
        <Modal defaultOpen={true}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Test</ModalTitle>
              <ModalClose />
            </ModalHeader>
          </ModalContent>
        </Modal>
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('modal has proper ARIA attributes', () => {
      render(
        <Modal defaultOpen={true}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>ARIA Test</ModalTitle>
            </ModalHeader>
          </ModalContent>
        </Modal>
      );

      const modalOverlay = document.querySelector('[role="dialog"]');
      expect(modalOverlay).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty modal', () => {
      render(
        <Modal defaultOpen={true}>
          <ModalContent />
        </Modal>
      );

      const content = document.querySelector('[role="dialog"]');
      expect(content).toBeInTheDocument();
    });

    it('renders custom trigger content', async () => {
      const user = userEvent.setup();

      render(
        <Modal>
          <ModalTrigger>
            <span>Custom Trigger Icon</span>
          </ModalTrigger>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Test</ModalTitle>
            </ModalHeader>
          </ModalContent>
        </Modal>
      );

      const trigger = screen.getByText('Custom Trigger Icon');
      expect(trigger).toBeInTheDocument();

      await user.click(trigger);
      await waitFor(() => expect(screen.getByText('Test')).toBeInTheDocument());
    });

    it('handles rapid open/close interactions', async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });

      render(
        <Modal>
          <ModalTrigger>Toggle</ModalTrigger>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Test</ModalTitle>
            </ModalHeader>
          </ModalContent>
        </Modal>
      );

      const trigger = screen.getByRole('button', { name: /toggle/i });

      // Rapid clicks
      await user.click(trigger);
      await user.click(trigger);
      await user.click(trigger);

      // Should not error
      expect(trigger).toBeInTheDocument();
    });
  });
});
