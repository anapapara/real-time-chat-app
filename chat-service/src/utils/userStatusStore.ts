export class UserStatusStore {
    private static instance: UserStatusStore;
    private userStatuses: Record<string, boolean>;

    private constructor() {
        this.userStatuses = {};
    }

    public static getInstance(): UserStatusStore {
        if (!UserStatusStore.instance) {
            UserStatusStore.instance = new UserStatusStore();
        }
        return UserStatusStore.instance;
    }

    public setUserOnline(userId: string) {
        this.userStatuses[userId] = true;
    }

    public setUserOffline(userId: string) {
        this.userStatuses[userId] = false;
    }

    public isUserOnline(userId: string): boolean {
        return !!this.userStatuses[userId];
    }
}