declare module 'zustand' {
  export function create<T>(): (config: any) => T & {
    getState: () => T;
    setState: (partial: Partial<T>) => void;
  };
}

declare module 'zustand/middleware' {
  export function persist<T>(
    config: (set: any, get: any, api: any) => T,
    options: {
      name: string;
      getStorage?: () => Storage;
    }
  ): (set: any, get: any, api: any) => T;
}

declare module '@chakra-ui/react' {
  export * from '@chakra-ui/react';
  export const Box: any;
  export const Container: any;
  export const Heading: any;
  export const Text: any;
  export const Button: any;
  export const VStack: any;
  export const FormControl: any;
  export const FormLabel: any;
  export const Input: any;
  export const Link: any;
  export const useToast: () => any;
  export const ChakraProvider: React.FC<{ children: React.ReactNode }>;
}

declare module 'react-hook-form' {
  export * from 'react-hook-form';
  export const useForm: any;
}

declare module 'next/navigation' {
  export function useRouter(): {
    push: (url: string) => void;
    replace: (url: string) => void;
    back: () => void;
  };
}

declare module 'next/link' {
  export * from 'next/link';
}

declare module 'axios' {
  interface AxiosRequestConfig {
    headers?: Record<string, string>;
  }
  
  const axios: {
    create: (config?: any) => {
      interceptors: {
        request: {
          use: (onFulfilled: (config: any) => any, onRejected: (error: any) => any) => void;
        };
        response: {
          use: (onFulfilled: (response: any) => any, onRejected: (error: any) => any) => void;
        };
      };
      get: (url: string, config?: any) => Promise<any>;
      post: (url: string, data?: any, config?: any) => Promise<any>;
      put: (url: string, data?: any, config?: any) => Promise<any>;
      delete: (url: string, config?: any) => Promise<any>;
    };
  };
  
  export default axios;
} 