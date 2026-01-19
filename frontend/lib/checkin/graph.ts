// LangGraph assembly for check-in flow

import { StateGraph, END } from '@langchain/langgraph';
import { CheckinState } from './types';
import * as nodes from './nodes';

/**
 * Create and compile the check-in graph
 */
export function createCheckinGraph() {
  // Define the state graph
  const workflow = new StateGraph<CheckinState>({
    channels: {
      // Input fields
      user_id: {
        value: (x: string, y?: string) => y ?? x,
        default: () => ''
      },
      session_id: {
        value: (x: string, y?: string) => y ?? x,
        default: () => ''
      },
      timestamp: {
        value: (x: Date, y?: Date) => y ?? x,
        default: () => new Date()
      },
      raw_input: {
        value: (x: string, y?: string) => y ?? x,
        default: () => ''
      },
      
      // Classification
      signals: {
        value: (x: any, y?: any) => y ?? x,
        default: () => undefined
      },
      
      // Follow-up
      needs_followup: {
        value: (x: boolean, y?: boolean) => y ?? x,
        default: () => false
      },
      followup_question: {
        value: (x: string | undefined, y?: string) => y ?? x,
        default: () => undefined
      },
      followup_response: {
        value: (x: string | undefined, y?: string) => y ?? x,
        default: () => undefined
      },
      
      // Mode selection
      selected_mode: {
        value: (x: any, y?: any) => y ?? x,
        default: () => undefined
      },
      mode_rationale: {
        value: (x: string | undefined, y?: string) => y ?? x,
        default: () => undefined
      },
      available_modes: {
        value: (x: string[] | undefined, y?: string[]) => y ?? x,
        default: () => undefined
      },
      
      // Intervention
      intervention_text: {
        value: (x: string | undefined, y?: string) => y ?? x,
        default: () => undefined
      },
      
      // Safety
      safety_flag: {
        value: (x: any, y?: any) => y ?? x,
        default: () => 'none'
      },
      
      // Policy state
      recent_modes: {
        value: (x: string[] | undefined, y?: string[]) => y ?? x,
        default: () => []
      },
      mode_feedback_history: {
        value: (x: any[] | undefined, y?: any[]) => y ?? x,
        default: () => []
      },
      
      // Metadata
      model_used: {
        value: (x: string | undefined, y?: string) => y ?? x,
        default: () => undefined
      },
      latency_ms: {
        value: (x: number | undefined, y?: number) => y ?? x,
        default: () => undefined
      },
      trace_id: {
        value: (x: string | undefined, y?: string) => y ?? x,
        default: () => undefined
      }
    }
  });

  // Add nodes
  workflow.addNode('intake', nodes.intakeNode);
  workflow.addNode('classify', nodes.classifyNode);
  workflow.addNode('safety', nodes.safetyCheckNode);
  workflow.addNode('decide_followup', nodes.decideFollowupNode);
  workflow.addNode('select_mode', nodes.selectModeNode);
  workflow.addNode('generate', nodes.generateInterventionNode);
  workflow.addNode('crisis', nodes.crisisResponseNode);
  workflow.addNode('persist', nodes.persistNode);

  // Define edges
  workflow.setEntryPoint('intake');
  workflow.addEdge('intake', 'classify');
  workflow.addEdge('classify', 'safety');
  
  // Conditional edge from safety check
  workflow.addConditionalEdges(
    'safety',
    (state) => {
      if (state.safety_flag === 'crisis' || state.safety_flag === 'medical') {
        return 'crisis';
      }
      return 'decide_followup';
    },
    {
      crisis: 'crisis',
      decide_followup: 'decide_followup'
    }
  );
  
  // Crisis path goes to persist then END
  workflow.addEdge('crisis', 'persist');
  
  // Conditional edge from decide_followup
  workflow.addConditionalEdges(
    'decide_followup',
    (state) => {
      // If follow-up is needed and we haven't received a response yet, end here
      // The API will return the follow-up question to the user
      if (state.needs_followup && !state.followup_response) {
        return 'end_for_followup';
      }
      // Otherwise, continue to mode selection
      return 'select_mode';
    },
    {
      end_for_followup: END,
      select_mode: 'select_mode'
    }
  );
  
  // Normal flow continues
  workflow.addEdge('select_mode', 'generate');
  workflow.addEdge('generate', 'persist');
  workflow.addEdge('persist', END);

  // Compile and return the graph
  return workflow.compile();
}

