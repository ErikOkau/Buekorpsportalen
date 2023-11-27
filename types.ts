// Typescript types
export interface Users {
    id: number;
    name: string;
    surname: string;
    email: string;
    password: string;
    role: string;
}

export interface Medlemmer {
    id: number;
    user_id: number;
    name: string;
    address: string;
    email: string;
    phone: string;
    peleton_id: number;
}


export interface Peleton {
    id: string;
    name: string;
    compantion_id: number;
}

export interface Companies {
    id: number;
    name: string;
    description: string;
    logo: string;
    address: string;
    city: string;
    user_id: number;
}

export interface Parents {
    id: number;
    name: string;
    surname: string;
    email: string;
    phone: string;
    user_id: number;
}

export interface Member_parent {
    id: number;
    member_id: number;
    parent_id: number;
}


import { SessionData } from 'express-session';

declare module 'express-serve-static-core' {
  interface Request {
    session: SessionData;
  }
}
