export type SurveyAssignmentStatus = 'PENDING' | 'COMPLETED' | 'EXPIRED';

export type SurveyListItem = {
  assignment_id: string;
  user_id: string;
  survey_id: string;
  assignment_status: SurveyAssignmentStatus;
  survey_title: string;
  question_count: number;
  assigned_at: string;
  valid_until: string | null;
};

export type SurveyOption = {
  id: string;
  text: string;
  sort_order: number;
};

export type UserAnswer = {
  response_text: string | null;
  selected_option_id: string | null;
  selected_option_text: string | null;
  answered_at: string;
};

export type SurveyQuestion = {
  id: string;
  text: string;
  type: string;
  sort_order: number;
  options: SurveyOption[];
  user_answer: UserAnswer | null;
};

export type SurveyDetailData = {
  survey_id: string;
  title: string;
  description: string | null;
  assignment_id: string;
  status: SurveyAssignmentStatus;
  assigned_at: string;
  completed_at: string | null;
  questions: SurveyQuestion[];
};
