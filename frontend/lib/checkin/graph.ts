// LangGraph assembly for check-in flow

import { StateGraph, END, Annotation } from '@langchain/langgraph';
import { CheckinState } from './types';
import * as nodes from './nodes';

/**
 * Create and compile the check-in graph
 */
export function createCheckinGraph() {
  // Define state schema using Annotation.Root (required by LangGraph)
  const StateAnnotation = Annotation.Root({
    user_id: Annotation<string>(),
    session_id: Annotation<string>(),
    timestamp: Annotation<Date>(),
    raw_input: Annotation<string>(),
    signals: Annotation<any>(),
    needs_followup: Annotation<boolean>(),
    followup_question: Annotation<string>(),
    followup_response: Annotation<string>(),
    selected_mode: Annotation<string>(),
    mode_rationale: Annotation<string>(),
    available_modes: Annotation<string[]>(),
    intervention_text: Annotation<string>(),
    safety_flag: Annotation<string>(),
    recent_modes: Annotation<string[]>(),
    mode_feedback_history: Annotation<any[]>(),
    model_used: Annotation<string>(),
    latency_ms: Annotation<number>(),
    trace_id: Annotation<string>(),
  });

  // Create workflow with proper Annotation
  const workflow: any = new StateGraph(StateAnnotation);

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
    (state: CheckinState) => {
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
    (state: CheckinState) => {
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

