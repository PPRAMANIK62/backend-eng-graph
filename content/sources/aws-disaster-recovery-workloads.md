---
id: aws-disaster-recovery-workloads
title: "Disaster Recovery of Workloads on AWS: Recovery in the Cloud"
author: Amazon Web Services
url: https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-workloads-on-aws.html
kind: docs
primary: true
---

## Summary

AWS Well-Architected whitepaper (2021 edition) on disaster recovery.
Read the pages on what a disaster is, high availability vs DR, the
business continuity plan with RTO and RPO, the four DR strategies
(backup and restore, pilot light, warm standby, multi-site
active/active), detection, and testing.

## Key claims

- Three kinds of disaster: natural, technical, human. "Human actions, such as inadvertent misconfiguration or unauthorized/outside party access or modification" (What is a disaster?)
- Availability is about components; DR is about whole copies of the workload. "Availability focuses on components of the workload, whereas disaster recovery focuses on discrete copies of the entire workload." (High availability is not disaster recovery)
- Replication copies deletions and corruption, so you also need point-in-time backups. "If a file or files are deleted or corrupted on the primary storage device, those destructive changes can be replicated to the secondary storage device." (High availability is not disaster recovery)
- DR plan is part of the business continuity plan. "Your disaster recovery plan should be a subset of your organization’s business continuity plan (BCP), it should not be a standalone document." (Business Continuity Plan)
- Impact can depend on time, e.g. payroll just before payday. "disruption to your payroll system is likely to have a very high impact to the business just before everyone gets paid, but it may have a low impact just after everyone has already been paid." (Business impact analysis)
- Having no DR can be a valid, informed choice. "For less critical workloads, a valid strategy may be not to have any disaster recovery in place at all." (Business impact analysis)
- RTO definition. "Recovery Time Objective (RTO) is the maximum acceptable delay between the interruption of service and restoration of service." (Recovery objectives)
- RPO definition. "Recovery Point Objective (RPO) is the maximum acceptable amount of time since the last data recovery point." (Recovery objectives)
- Don't spend more on recovery than the loss costs, unless required. "If the cost of the recovery strategy is higher than the cost of the failure or loss, the recovery option should not be put in place unless there is a secondary driver such as regulatory requirements." (Recovery objectives, Note)
- Four strategies from cheap and simple to multi-region active/active. "Disaster recovery strategies available to you within AWS can be broadly categorized into four approaches, ranging from the low cost and low complexity of making backups to more complex strategies using multiple active Regions." (Disaster recovery options in the cloud)
- Fail over with data-plane operations, not control-plane ones. "For maximum resiliency, you should use only data plane operations as part of your failover operation." (Disaster recovery options in the cloud)
- Backup frequency sets the achievable recovery point. "How often you run your backup will determine your achievable recovery point (which should align to meet your RPO)." (Backup and restore)
- Back up code, config and infrastructure too; redeploy with infrastructure as code. "In addition to data, you must redeploy the infrastructure, configuration, and application code in the recovery Region." (Backup and restore)
- Backup strategy must include testing backups. "Your backup strategy must include testing your backups." (Backup and restore, Note)
- Pilot light: data replicated and core infrastructure on, app servers off until needed. "Other elements, such as application servers, are loaded with application code and configurations, but are "switched off" and are only used during testing or when disaster recovery failover is invoked." (Pilot light)
- Warm standby can take traffic at reduced capacity right away; pilot light can't. "The distinction is that pilot light cannot process requests without additional action taken first, whereas warm standby can handle traffic (at reduced capacity levels) immediately." (Warm standby)
- Automatic failover risks false alarms; manual initiation with automated steps is common. "If you fail over when you don’t need to (false alarm), then you incur those losses. Manually initiated failover is therefore often used." (Pilot light)
- Even active/active needs backups: data corruption means a recovery point before the problem was found. "recovery times for a data disaster involving data corruption, deletion, or obfuscation will always be greater than zero and the recovery point will always be at some point before the disaster was discovered." (Multi-site active/active)
- Detection and the decision to declare a disaster count against RTO. "If your recovery time objective is one hour, then you need to detect the incident, notify appropriate personnel, engage your escalation processes, evaluate information (if you have any) on expected time to recovery (without executing the DR plan), declare a disaster and recover within an hour." (Detection)
- Only tested recovery paths work. "Our experience has shown that the only error recovery that works is the path you test frequently." (Testing disaster recovery)
- The standby's capacity or quotas may have drifted since last test. "The capacity of the secondary, which might have been sufficient when you last tested, might no longer be able to tolerate the load under this scenario, or service quotas in the secondary Region might not be sufficient." (Testing disaster recovery)
- Manage configuration drift in the DR site. "Manage configuration drift at the DR Region." (Testing disaster recovery)
- (For disaster-recovery.) Manual start, automated steps: one button. "In this case, you should still automate the steps for failover, so that the manual initiation is like the push of a button." (Pilot light)
- Hesitating to invoke DR signals weak plans or low confidence. "The decision not to invoke DR plans may be because the plans are inadequate or there is a lack of confidence in execution." (Detection, Note)
- Scope matters: a local flood is a Multi-AZ problem, an attack on data needs backups elsewhere. "For example, you can mitigate a local flooding issue causing a data center outage by employing a Multi-AZ strategy, since it would not affect more than one Availability Zone." (What is a disaster?)
- DNS failover is a data-plane operation. "you can configure automatically initiated DNS failover to ensure traffic is sent only to healthy endpoints, which is a highly reliable operation done on the data plane." (Pilot light)

## Visuals worth redrawing

- Figure 3, recovery objectives: a timeline with the last recovery point, the disaster, and service restored; RPO is the gap before, RTO the gap after.
- Figure 6, the four strategies on a line from RPO/RTO of hours (backup and restore) to near real time (active/active).

## My notes

- The strategy chart in Figure 6 carries rough RPO/RTO labels in the image; I didn't read them as text, so no numbers from it.
