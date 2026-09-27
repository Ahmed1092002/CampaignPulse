'use client';

import { useToast } from '@/components/ui/Toast';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-[380px] lg:w-[420px]">
      {toasts.map(({ id, title, description, type, duration }) => (
        <Toast key={id} title={title} description={description} type={type} duration={duration} />
      ))}
    </div>
  );
}