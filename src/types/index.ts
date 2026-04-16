export type RequestStatus = 
  | 'Submitted' 
  | 'Pending Monthly Dispatch' 
  | 'Sent to ISPL PM' 
  | 'In Progress by ISPL PM' 
  | 'Completed' 
  | 'Notification Sent';

export type RequestType = 'Creation' | 'Amendment';

export interface CostCenterMaster {
  id?: string;
  CostCenterCode: string;
  CostCenterName: string;
  Department: string;
  Team: string;
  BusinessManager: string;
  PMO: string;
  HOD: string;
  Domain: string;
  Cluster: string;
  Cluster1: string;
  Cluster2: string;
  ParadigmCode: string;
  ParadigmCodeDescription: string;
  Location: string;
  ExCo: string;
  Status: 'Active' | 'Inactive';
  EffectiveDate: string;
  LastUpdatedDate: string;
}

export interface CostCenterRequest {
  id?: string;
  RequestID: string;
  RequestType: RequestType;
  
  // Amendment specific
  ExistingCostCenterCode?: string;
  ExistingCostCenterName?: string;
  
  // Common proposing fields
  ProposedCostCenterCode: string;
  ProposedCostCenterName: string;
  
  DepartmentOld?: string;
  DepartmentProposed: string;
  DepartmentFinal?: string;
  
  TeamOld?: string;
  TeamProposed: string;
  TeamFinal?: string;
  
  BusinessManagerOld?: string;
  BusinessManagerProposed: string;
  BusinessManagerFinal?: string;
  
  PMOOld?: string;
  PMOProposed: string;
  PMOFinal?: string;
  
  HODOld?: string;
  HODProposed: string;
  HODFinal?: string;

  DomainOld?: string;
  DomainProposed: string;
  ClusterOld?: string;
  ClusterProposed: string;
  Cluster1Old?: string;
  Cluster1Proposed: string;
  Cluster2Old?: string;
  Cluster2Proposed: string;
  ParadigmCodeOld?: string;
  ParadigmCodeProposed: string;
  ParadigmCodeDescriptionOld?: string;
  ParadigmCodeDescriptionProposed: string;
  LocationOld?: string;
  LocationProposed: string;
  ExCoOld?: string;
  ExCoProposed: string;
  
  DomainFinal?: string;
  ClusterFinal?: string;
  Cluster1Final?: string;
  Cluster2Final?: string;
  ParadigmCodeFinal?: string;
  ParadigmCodeDescriptionFinal?: string;
  LocationFinal?: string;
  ExCoFinal?: string;
  
  Justification: string;
  SubmittedBy: string;
  SubmittedByEmail: string;
  SubmittedDate: string;
  Status: RequestStatus;
  
  // Tracking
  BatchSentDate?: string;
  UpdatedByISPLPM?: string;
  UpdatedDate?: string;
  CompletionDate?: string;
  NotificationSent: boolean;
  NotificationSentDate?: string;
  ISPLPMRemarks?: string;
}

export interface MonthlyBatchLog {
  id?: string;
  BatchMonth: string;
  BatchDate: string;
  TotalRequestsSent: number;
  FileName: string;
  SentToEmail: string;
  SentBy: string;
  SentTimestamp: string;
}
