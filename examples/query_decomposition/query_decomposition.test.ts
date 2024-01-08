import { expect, test } from "bun:test"
import { type } from "ts-inference-check"

import { createQueryPlan, QueryPlan } from "."

test("Should return a query plan", async () => {
  const queryPlan = await createQueryPlan(
    "What is the difference in populations of Canada and the Jason's home country?"
  )

  expect(type(queryPlan).strictly.is<QueryPlan>(true)).toBeTrue()
})
