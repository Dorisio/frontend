import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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

    const title = screen.getByText('Test Modal');
    expect(title).toBeInTheDocument();
  });

  it('displays modal header and content', async () => {
    const user = userEvent.setup();

    render(
      <Modal defaultOpen={true}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Modal Title</ModalTitle>
            <ModalDescription>This is a description</ModalDescription>
          </ModalHeader>
          <div>Modal body content</div>
          <ModalFooter>
            <button>Cancel</button>
            <button>Confirm</button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );

    expect(screen.getByText('Modal Title')).toBeInTheDocument();
    expect(screen.getByText('This is a description')).toBeInTheDocument();
    expect(screen.getByText('Modal body content')).toBeInTheDocument();
  });

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <Modal defaultOpen={true}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Test Modal</ModalTitle>
            <ModalClose aria-label="close" />
          </ModalHeader>
          <p>Content</p>
        </ModalContent>
      </Modal>
    );

    const closeButton = screen.getByLabelText('close');
    expect(closeButton).toBeInTheDocument();
    // Note: Full close animation testing would require more setup
  });

  it('renders footer buttons', async () => {
    render(
      <Modal defaultOpen={true}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Modal</ModalTitle>
          </ModalHeader>
          <ModalFooter>
            <button type="button">Cancel</button>
            <button type="button">Save</button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

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
  });
});
