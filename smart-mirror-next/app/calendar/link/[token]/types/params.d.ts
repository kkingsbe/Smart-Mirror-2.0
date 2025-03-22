declare module 'next' {
  export interface PageProps {
    params: { token: string };
    searchParams?: { [key: string]: string | string[] | undefined };
  }
}

export {}; 