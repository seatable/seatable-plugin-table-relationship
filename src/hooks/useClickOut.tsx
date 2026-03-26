import { useEffect, useRef } from 'react';

const useClickOut = (handler: any) => {
  const domNode = useRef<any>();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const handleOutsideClick = (event: any) => {
      if (!domNode?.current?.contains(event.target)) {
        handlerRef.current();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return domNode;
};

export default useClickOut;
