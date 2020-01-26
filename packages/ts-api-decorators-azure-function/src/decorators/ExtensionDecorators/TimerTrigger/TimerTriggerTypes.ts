export interface IAzureFunctionsTimer {
    Schedule: {
        AdjustForDST: boolean;
    };
    ScheduleStatus: {
        Last: Date;
        LastUpdated: Date;
        Next: Date;
    },
    IsPastDue?: boolean;
}