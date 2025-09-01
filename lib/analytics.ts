export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

declare global {
  interface Window {
    gtag: (...args: any[]) => void
  }
}

export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag && GA_MEASUREMENT_ID) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    })
  }
}

export const event = (
  action: string,
  {
    event_category,
    event_label,
    value,
  }: {
    event_category: string
    event_label?: string
    value?: number
  }
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category,
      event_label,
      value,
    })
  }
}

export const surveyEvents = {
  createSurvey: (surveyId: string, surveyType: string) => {
    event('survey_create', {
      event_category: 'Survey',
      event_label: surveyType,
      value: 1,
    })
  },

  publishSurvey: (surveyId: string) => {
    event('survey_publish', {
      event_category: 'Survey',
      event_label: 'publish',
      value: 1,
    })
  },

  saveDraft: (surveyId: string) => {
    event('survey_draft', {
      event_category: 'Survey',
      event_label: 'draft',
      value: 1,
    })
  },

  submitResponse: (surveyId: string, responseTime: number) => {
    event('survey_response', {
      event_category: 'Survey',
      event_label: 'response_submit',
      value: Math.round(responseTime / 1000), // seconds
    })
  },

  viewResults: (surveyId: string) => {
    event('survey_results', {
      event_category: 'Survey',
      event_label: 'view_results',
      value: 1,
    })
  },

  earnPoints: (points: number, source: string) => {
    event('points_earned', {
      event_category: 'Points',
      event_label: source,
      value: points,
    })
  },

  spendPoints: (points: number, purpose: string) => {
    event('points_spent', {
      event_category: 'Points',
      event_label: purpose,
      value: points,
    })
  }
}