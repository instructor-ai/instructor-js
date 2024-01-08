import { describe, expect, test } from "bun:test"
import OpenAI from "openai"
import { type } from "ts-inference-check"

import { ActionItems, actionItems } from "./action_items"
import {
  MULTI_CLASSIFICATION_LABELS,
  multiClassification,
  MultiClassification
} from "./classification/multi_prediction"
import {
  SIMPLE_CLASSIFICATION_LABELS,
  SimpleClassification,
  simpleClassification
} from "./classification/simple_prediction"
import { user as baseUser, User as BaseUserType } from "./extract_user"
import { Extraction, extractionStream } from "./extract_user_stream"
import { user as anyScaleUser, User as AnyScaleUserType } from "./extract_user/anyscale"
import { user as propertiesUser, User as PropertiesUserType } from "./extract_user/properties"
import { graph, KnowledgeGraph } from "./knowledge-graph"
import { completion } from "./passthrough"
import { QueryPlan, queryPlan } from "./query_decomposition"
import { Entity, model } from "./resolving-complex-entitities"

describe("examples", () => {
  // these tests maintain the type inference of examples

  test("Resolving Complex Entities", () => {
    expect(type(model.entities).strictly.is<Entity[]>(true)).toBeTrue()
  })

  test("Query Decomposition", () => {
    expect(type(queryPlan).strictly.is<QueryPlan>(true)).toBeTrue()
  })

  test("Knowledge Graph", () => {
    expect(type(graph).strictly.is<KnowledgeGraph>(true)).toBeTrue()
  })

  test("Extract User Stream", async () => {
    expect(
      type(extractionStream).strictly.is<AsyncGenerator<Extraction, void, unknown>>(true)
    ).toBeTrue()
  })

  test("Passthrough", async () => {
    expect(type(completion).strictly.is<OpenAI.Chat.ChatCompletion>(true)).toBeTrue()
  })

  test("Action Items", () => {
    expect(type(actionItems).strictly.is<ActionItems>(true)).toBeTrue()
  })

  test("Extract User", () => {
    expect(type(baseUser).strictly.is<BaseUserType>(true)).toBeTrue()

    expect(type(anyScaleUser).strictly.is<AnyScaleUserType>(true)).toBeTrue()

    expect(type(propertiesUser).strictly.is<PropertiesUserType>(true)).toBeTrue()
  })

  test("Classification", () => {
    expect(type(simpleClassification).strictly.is<SimpleClassification>(true)).toBeTrue()
    expect(simpleClassification.class_label).toBe(SIMPLE_CLASSIFICATION_LABELS.SPAM)

    expect(type(multiClassification).strictly.is<MultiClassification>(true)).toBeTrue()
    expect(multiClassification.predicted_labels).toContain([
      MULTI_CLASSIFICATION_LABELS.BILLING,
      MULTI_CLASSIFICATION_LABELS.HARDWARE
    ])
  })
})
