import Instructor from "@/instructor"
import OpenAI from "openai"
import { z } from "zod"

const PrioritySchema = z.enum(["HIGH", "MEDIUM", "LOW"])

const SubtaskSchema = z.object({
  id: z.number(),
  name: z.string()
})

const TicketSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  priority: PrioritySchema,
  assignees: z.array(z.string()),
  subtasks: z.array(SubtaskSchema).optional(),
  dependencies: z.array(z.number()).optional()
})

const ActionItemsSchema = z.object({
  items: z.array(TicketSchema)
})

const oai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? undefined,
  organization: process.env.OPENAI_ORG_ID ?? undefined
})

const client = Instructor({
  client: oai,
  mode: "TOOLS"
})

const extractActionItems = async (data: string) => {
  const actionItems = await client.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "The following is a transcript of a meeting..."
      },
      {
        role: "user",
        content: `Create the action items for the following transcript: ${data}`
      }
    ],
    model: "gpt-4o",
    response_model: { schema: ActionItemsSchema, name: "ActionItems" },
    max_tokens: 1000,
    temperature: 0.0,
    max_retries: 2,
    seed: 1
  })

  return actionItems
}

const actionItems = await extractActionItems(
  `Alice: Hey team, we have several critical tasks we need to tackle for the upcoming release. First, we need to work on improving the authentication system. It's a top priority.

  Bob: Got it, Alice. I can take the lead on the authentication improvements. Are there any specific areas you want me to focus on?

  Alice: Good question, Bob. We need both a front-end revamp and back-end optimization. So basically, two sub-tasks.
  Carol: I can help with the front-end part of the authentication system.

  Bob: Great, Carol. I'll handle the back-end optimization then.

  Alice: Perfect. Now, after the authentication system is improved, we have to integrate it with our new billing system. That's a medium priority task.

  Carol: Is the new billing system already in place?

  Alice: No, it's actually another task. So it's a dependency for the integration task. Bob, can you also handle the billing system?

  Bob: Sure, but I'll need to complete the back-end optimization of the authentication system first, so it's dependent on that.

  Alice: Understood. Lastly, we also need to update our user documentation to reflect all these changes. It's a low-priority task but still important.

  Carol: I can take that on once the front-end changes for the authentication system are done. So, it would be dependent on that.

  Alice: Sounds like a plan. Let's get these tasks modeled out and get started.`
)

// "{\"items\":[{\"id\":1,\"name\":\"Improve Authentication System\",\"description\":\"Work on improving the authentication system, including front-end revamp and back-end optimization.\",\"priority\":\"HIGH\",\"assignees\":[\"Bob\",\"Carol\"],\"subtasks\":[{\"id\":1.1,\"name\":\"Front-end Revamp\"},{\"id\":1.2,\"name\":\"Back-end Optimization\"}],\"dependencies\":[]},{\"id\":2,\"name\":\"Integrate Authentication with Billing System\",\"description\":\"Integrate the improved authentication system with the new billing system.\",\"priority\":\"MEDIUM\",\"assignees\":[\"Bob\"],\"subtasks\":[],\"dependencies\":[1,3]},{\"id\":3,\"name\":\"Implement New Billing System\",\"description\":\"Set up the new billing system which is required for integration with the authentication system.\",\"priority\":\"MEDIUM\",\"assignees\":[\"Bob\"],\"subtasks\":[],\"dependencies\":[1.2]},{\"id\":4,\"name\":\"Update User Documentation\",\"description\":\"Update the user documentation to reflect changes in the authentication and billing systems.\",\"priority\":\"LOW\",\"assignees\":[\"Carol\"],\"subtasks\":[],\"dependencies\":[1.1]}]}"
console.log({ actionItems: JSON.stringify(actionItems) })
