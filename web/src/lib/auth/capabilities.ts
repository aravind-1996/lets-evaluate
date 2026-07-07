import type { MemberRole } from "@/lib/auth/config";

export function canViewAllCandidates(role: MemberRole) {
  return role === "admin";
}

export function canAssignInterviewers(role: MemberRole) {
  return role === "admin" || role === "ta";
}

export function canManageSetup(role: MemberRole) {
  return role === "admin";
}

export function isTeamLead(role: MemberRole) {
  return role === "admin" || role === "ta";
}
