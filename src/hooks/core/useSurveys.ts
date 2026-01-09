import { useCallback, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { SurveyDetailData, SurveyListItem } from '@mr-types/survey.types';
import { useUser } from '@/src/contexts/UserContext';

export const useMySurveys = () => {
  const { me } = useUser();
  const [surveys, setSurveys] = useState<SurveyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSurveys = useCallback(async () => {
    if (!me?.user_id) return;

    try {
      const { data, error } = await supabase
        .from('v_my_survey_assignments')
        .select('*')
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      setSurveys(data as unknown as SurveyListItem[]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [me?.user_id]);

  const refresh = () => {
    setRefreshing(true);
    fetchSurveys();
  };

  return { surveys, loading, refreshing, refresh, fetchSurveys };
};

export const useSurveyDetail = (surveyId: string) => {
  const { me } = useUser();
  const [survey, setSurvey] = useState<SurveyDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!me?.user_id || !surveyId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_survey_details', {
        p_user_id: me.user_id,
        p_survey_id: surveyId,
      });

      if (error) throw error;
      setSurvey(data as unknown as SurveyDetailData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [me?.user_id, surveyId]);

  const submitSurvey = async (answers: Record<string, { optionId?: string; text?: string }>) => {
    if (!survey) return;
    setSubmitting(true);

    try {
      const assignmentId = survey.assignment_id;

      const answersPayload = Object.entries(answers).map(([questionId, val]) => ({
        assignment_id: assignmentId,
        question_id: questionId,
        selected_option_id: val.optionId || null,
        response_text: val.text || null,
        updated_at: new Date().toISOString(),
      }));

      if (answersPayload.length > 0) {
        const { error: ansError } = await supabase
          .from('survey_answers')
          .upsert(answersPayload, { onConflict: 'assignment_id, question_id' });

        if (ansError) throw ansError;
      }

      const { error: submitError } = await supabase.rpc('submit_survey_assignment', {
        p_assignment_id: assignmentId,
      });

      if (submitError) throw submitError;

      return true;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  return { survey, loading, submitting, fetchDetail, submitSurvey };
};
