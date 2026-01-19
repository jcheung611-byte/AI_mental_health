// LangGraph assembly for check-in flow

import { StateGraph, END } from '@langchain/langgraph';
import { CheckinState } from './types';
import * as nodes from './nodes';

/**
 * Create and compile the check-in graph
 */
export function createCheckinGraph() {
  // Create workflow - StateGraph automatically handles state updates from node returns
  const workflow: any = new StateGraph({});

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

