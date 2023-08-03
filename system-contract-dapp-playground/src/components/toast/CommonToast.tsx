import Link from 'next/link';
import { ReactNode } from 'react';
import { CreateToastFnReturn, ToastPosition } from '@chakra-ui/react';
interface PageProps {
  toaster: CreateToastFnReturn;
  title?: string;
  description?: string;
  position?: ToastPosition;
  render?: ReactNode;
  status?: 'success' | 'error' | 'warning' | 'info' | 'loading';
}

export const CommonErrorToast = ({ toaster, title, description }: PageProps) => {
  toaster({
    position: 'top',
    render: () => (
      <div className="text-white text-center font-styrene bg-black px-6 py-3 rounded-xl tracking-wide flex flex-col gap-1">
        <div className="font-medium">🚨 {title} 🚨</div>
        <div>{description}</div>
      </div>
    ),
  });
};

export const NoEthToast = ({ toaster }: PageProps) => {
  toaster({
    position: 'top',
    render: () => (
      <div className="text-white text-center font-styrene bg-black px-6 py-3 rounded-xl tracking-wide">
        <div className="font-medium">🚨 No Ethereum wallet detected 🚨</div>
        <div>
          Please download{' '}
          <Link
            href="https://metamask.io/download/"
            target="_blank"
            className="underline hover:underline text-hedera-purple"
          >
            {' '}
            Metamask
          </Link>{' '}
          to contiue{' '}
        </div>
      </div>
    ),
  });
};

export const NetworkMismatchToast = ({ toaster }: PageProps) => {
  toaster({
    position: 'top',
    render: () => (
      <div className="text-white font-styrene bg-black px-6 py-3 rounded-xl tracking-wide max-w-sm">
        <div className="font-semibold">🚨 Current network mismatch! 🚨</div>
        <div>
          Follow this{' '}
          <Link
            href="https://github.com/hashgraph/hedera-smart-contracts/tree/main/system-contract-dapp-playground#initial-account-and-wallet-setup-important"
            target="_blank"
            className="underline hover:underline text-hedera-purple"
          >
            setup guides
          </Link>{' '}
          for proper account and network setup.
        </div>
      </div>
    ),
  });
};
