import { useEffect, useRef, useState } from 'react';

const useCoordinatesMap = (handler: any) => {
  const domNode = useRef<any>();
  const [updatedCoordinatesMap, setUpdatedCoordinatesMap] = useState([]);

  useEffect(() => {
    const handleOutsideClick = (event: any) => {
      if (!domNode?.current?.contains(event.target)) {
        handler();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  });

  return domNode;
};

export default useCoordinatesMap;
