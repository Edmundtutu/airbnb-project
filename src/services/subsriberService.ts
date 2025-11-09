import  api  from './api';

const apiVersion = import.meta.env.VITE_API_VERSION;


export const SubscriberService ={
    async subscribe(email: string): Promise<void> {
        await api.post(`${apiVersion}/subscribe`, { email });
    }
}