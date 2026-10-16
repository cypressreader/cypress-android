/* The sample edition shown in the live demo on the homepage (docs/demo.html).
   Everything here is made up: no real publishers, people, places or companies.
   Story body markup (blocks are separated by a blank line):
     ## Heading         a subheading
     > text             a pull quote
     !N | caption       a picture inside the story (docs/demo/art-N.svg, N is 24 to 35) with a caption
     - a                list items, one per line
     anything else      a paragraph
   lead: the lead picture is docs/demo/art-<index>.svg (the story's position, 0 to 23) unless lead is false. */
module.exports = {
  feeds: [
    {
      id: 'circuit', name: 'Circuit', cat: 'Technology',
      stories: [
        {
          t: 'The slow return of the long read', s: 'Readers are slowing down, and the stories that win are the ones that take their time.', sec: 'Ideas', by: 0,
          body: `There is a particular pleasure in a story that refuses to hurry. It settles in, asks for your attention, and returns it with interest. For years the received wisdom was that nobody had the patience for it. The numbers now say something different.

Across a dozen newsrooms we spoke to, editors described the same quiet surprise. The longest pieces they publish are often the ones readers finish. Not skim, not save for later and forget, but read to the last line, usually in one sitting and often on a phone.

## What readers actually do

Reading logs from three small publications showed a pattern that surprised even the people who kept them. A piece of 3,000 words was opened by fewer people than a piece of 600. But of those who opened it, a larger share reached the end. The long read was a smaller door with a better room behind it.

!24 | A reader’s desk at the end of a long Sunday. The coffee, as usual, went cold.

The effect was strongest in the early morning and late evening, the two parts of the day when people said they felt least pulled in other directions. One editor put it bluntly: nobody reads a thoughtful essay on the way to a meeting, and nobody ever claimed they did.

## The shape of a good story

A good long read has a shape. It has a beginning that earns your trust, a middle that rewards it, and an ending that lets you stop. That last part matters more than it sounds. Most digital reading has no ending at all. It has a next thing, then another, and the sense of being finished never arrives.

> A good long read has a shape, and the shape is what lets you stop.

Writers who work at length talk about this constantly. A piece is built like a journey with a destination, they say, and the reader should always know roughly how far along they are. Subheadings, a clear opening promise and a closing image all help. None of it is clever. It is the old craft of putting things in order.

## Why feeds lost it

The feed, as a format, is built for continuing. Its job is to make sure there is always another item below the one you are looking at. That is a fine job for a tool that helps you find things. It is a poor fit for the experience of reading something properly.

Designers we spoke to described the trade-off plainly. A feed optimises for the next tap. A story optimises for the last line. The two goals pull in opposite directions, and for a while the feed was winning simply because it was easier to measure.

- A feed has no edges. A story does.
- A feed rewards the quick glance. A story rewards the settled hour.
- A feed asks what is next. A story asks whether you are done.

## A small experiment

One reader, a teacher in her fifties, told us about a rule she tried for a month. Before opening any messages in the morning, she would read one full story, start to finish, with nothing else on the screen. She chose from a short list she kept the night before.

!25 | Her notes from the first week. The list got shorter, and so did her mornings.

By the second week she noticed that she was remembering what she read. By the third she had stopped checking the clock. By the end of the month, she said, the story had become the part of the day she was least willing to give up, and the part she had once been most certain she had no time for.

She was careful not to oversell it. Nothing dramatic had happened. She felt less behind, which she admitted was an odd thing to feel about a hobby.

## Two newsrooms, two experiments

Two of the newsrooms we spoke to ran their own small tests. The first, a regional weekly, moved its longest feature of the month to the top of its front page and gave it a clear reading time. Readers who opened it spent, on average, nine minutes with it. The editor said she had never seen figures like that for anything else the paper published.

The second, a small online magazine, tried the opposite. It published a piece of the same length with no reading time and no clear ending, as part of an endless scroll of related links. Readers opened it in similar numbers, but far fewer reached the last paragraph, and the average time on the page was less than three minutes.

!25 | A weekly planning wall in the regional newsroom. The long feature is the card in the middle.

Neither test was scientific, and both editors said so. But the contrast was striking enough that both changed how they presented long pieces, and both now put the reading time and a visible sense of progress on every feature over a thousand words.

## What the critics say

Not everyone is convinced. A media researcher we spoke to pointed out that readers who choose a long piece are, almost by definition, the readers most willing to finish one. Counting them proves less than it seems.

She also cautioned against romanticising length. Many long stories are long because nobody edited them, and a padded piece is no more virtuous than a padded email. Length, she said, is only a virtue when it is earned.

> Length is only a virtue when it is earned, and the edit is where it is earned.

The writers and editors we spoke to mostly agreed. The aim is not to make everything longer. It is to make sure that whatever the length, the piece has a shape, a promise at the start and a kept promise at the end. A good short piece and a good long one have more in common than either has with a bad one of its own size.

## What changes when a tool helps

None of this requires giving up headlines or live updates. A good news tool can do both. It can show what is happening and also provide a place where the news is composed, paced and complete, with a page that ends and a line that tells you that you are caught up.

Product teams that have tried this describe a similar surprise. When a tool tells people they are done, they do not leave. They come back more often, and stay for less time, and report liking it more. Being finished, it turns out, is a feature.

There is a quieter benefit that is harder to put in a chart. Several readers told us that finishing something long made the rest of the day feel less scattered. They did not become more productive, exactly. They simply felt that one thing, at least, had been done properly from start to finish, and that was enough to steady the afternoon.

## What to try

If you want to test it yourself, the experiment is small and cheap.

- Pick one story the night before. Make it a long one.
- Read it before you open anything else in the morning.
- Finish it. If you stop halfway, note why.
- After a week, notice what you remember.

Some readers go further. They keep a small notebook of the long pieces they have finished, with a line or two about each, and say that rereading it on a grey afternoon is a pleasure in its own right. It is a record, they say, of attention given and well spent, which is more than most of our days can claim.

The simplest test is the one most of us already use. At the end of a reading session, do you feel done, or do you feel pulled? The best tools leave you with the first feeling, and the best writers have always known how to give it to you.`,
        },
        {
          t: 'Why your phone battery is not the problem anymore', s: 'Chips got efficient. The habits around them did not.', sec: 'Phones', by: 1,
          body: `For a decade, the phone battery was the thing everyone complained about. Charge it overnight, carry a cable, hunt for a socket in a café. The complaint was so universal that it became a kind of small talk.

Then, quietly, it stopped. Not because batteries became magical, but because the chips inside phones became much better at doing very little. A modern phone spends most of the day asleep, waking for a moment to check something and drifting off again. The screen, once the great drain, now adjusts itself dozens of times a minute.

## Where the power really goes

Engineers who measure this for a living say the big costs have moved. The processor is rarely the culprit. The screen still matters, but mostly when it is bright and busy. The real hidden cost is the radio, the part that talks to the network.

!26 | A test bench in a battery lab. Each phone runs the same ten-minute routine.

Every time an app asks the network for something, the radio wakes up, does its work and takes a while to settle down again. Ten apps asking for ten small things in ten different moments costs far more than one request carrying them all.

> The cheapest request is the one that never has to be made.

## The habits that matter

If your battery still feels thin, the likely cause is not the phone. It is the number of things quietly asking for attention. A few changes help more than any new charger.

- Turn off background refresh for apps you open once a week.
- Let the phone batch its alerts instead of delivering each one.
- Use dark themes on screens that support them, and keep brightness modest.
- Prefer apps that fetch things in one go, then leave you alone.

## A calmer way to look at it

None of this is about deprivation. The point is that the best battery saving is also a quieter life. Fewer wake-ups means fewer interruptions, and fewer interruptions means more of the day spent on whatever you picked up the phone to do.

One engineer who tests battery life for a living put it in a way that stuck with us. When a phone lasts two days instead of one, she said, people do not charge it less. They simply stop thinking about it. That, she said, is the real measure of a good battery: the day you stop noticing it.`,
        },
        {
          t: 'A field guide to doing nothing, well', s: 'An unhurried look at the lost art of sitting still with a screen switched off.', sec: 'Habits', by: 2,
          body: `Doing nothing is harder than it sounds. It is also, according to a small but growing number of people, one of the more useful things you can do with an afternoon.

The trouble is that most of us have forgotten how. We reach for the phone in every gap, the way a hand reaches for a pocket. Waiting for a kettle, standing in a queue, sitting in a lift: each is a small opening that gets filled almost before it appears.

## Start very small

The advice from people who practise this is gentle and consistent. Do not begin with an hour. Begin with a minute, and make it a specific minute, one you can recognise every day.

!27 | The window seat, a good place to practise. No phone required.

A teacher who has done this for years starts with the kettle. While it boils, she looks out of the window and does nothing else. She says it took a fortnight before it stopped feeling strange.

## A few places to try

- **The kettle.** Stand and watch. It is a ready-made timer.
- **The bus stop.** Look at the street instead of the screen.
- **The first minute of a walk.** Leave the headphones in your pocket for it.
- **Before the first message of the day.** Sit with a cup of something warm.
- **The end of a meal.** Stay at the table a little while after the plates are cleared.

> Boredom is not the opposite of interest. It is the doorway to it.

## What you may notice

Most people report the same sequence. First comes restlessness, an urge to check something, anything. Then a slight sense of being exposed. Then, sometimes after a week and sometimes after a month, a quiet that feels like relief.

None of this needs to be solemn. Doing nothing can be done with a biscuit. It can be done with a dog. The only rule is that the screen stays dark and you let your mind wander wherever it wants to go.

The people who stick with it rarely describe it as productive, and they are slightly wary of anyone who does. They describe it as a place to stand for a while, between one thing and the next.`,
        },
        {
          t: 'The accessibility feature everyone ended up using', s: 'Captions, large text and voice control started as help for some and became tools for all.', sec: 'Design', by: 3,
          body: `Many of the features we now take for granted started life as help for a particular group of people. Captions were built for viewers who could not hear. Large text was built for readers who could not see small print. Voice control was built for people who could not easily use their hands.

Today, all three are used by millions who would never think of themselves as needing help. That pattern is so common that designers have a name for it: the curb-cut effect, after the sloped kerbs that were meant for wheelchairs and turned out to help parents with prams, travellers with cases and anyone on a bicycle.

## Captions on, sound off

The clearest example is captions. Surveys of viewers consistently show that most people who turn them on do not have any difficulty hearing. They are watching on a train, in a waiting room, in a house where someone else is asleep.

!28 | A caption editor’s screen. The work is mostly careful listening.

For a producer, the lesson is hard to miss. A feature that costs a little to add can serve a far larger audience than anyone planned for.

## Large text, quietly

Large text works the same way. A great many people raise their text size and never mention it. A tired reader at the end of a long day does not want to squint, and no one needs to have a diagnosis to prefer comfortable type.

> Designing for the edges tends to improve the middle.

## What this means for builders

Teams that treat accessibility as a late fix usually find it expensive and awkward. Teams that treat it as a starting point tend to find the opposite. The decisions that help someone with low vision, such as clear contrast, sensible spacing and plain language, tend to help everyone.

A few habits show up in the teams that do it well:

- They test with real people who use assistive tools, early and often.
- They treat settings as a feature, not a hiding place.
- They write labels that make sense when read aloud.

The result is rarely dramatic. It is simply software that feels considerate, which most people can recognise even when they cannot say why.`,
        },
        {
          t: 'Inside the town that rebuilt its library', s: 'Volunteers, a leaky roof and four years of Saturday mornings.', sec: 'Community', by: 4,
          body: `When the roof of the old library began to leak, nobody was surprised. It had been leaking, on and off, for longer than most of the town could remember. What surprised people was the Saturday morning, four years ago, when two dozen of them turned up with ladders.

The building sits at the end of Corbel Street, a narrow brick hall from the last century, with tall windows and a wooden floor that creaks in four distinct notes. The council had talked about closing it. Instead, a retired joiner named Ines Varga posted a notice on the door asking who would like to help.

## The first Saturday

The first job was the roof. A local builder lent scaffolding. A schoolteacher brought tea. By lunchtime, a dozen buckets had been moved from the reading room to the car park, which several volunteers described as the single most satisfying moment of the project.

!29 | The reading room on the first Saturday. The buckets were still out.

The work then settled into a rhythm. Saturdays were for repairs. Weeknights were for sorting, because a library that has been half closed for years collects a great many boxes.

## Books, and a little more

There was never a grand plan. The group started by cataloguing what was there, found a good deal that was missing and put out a call for gifts. Within a year the shelves were full again, and by the second the building had started to do other things.

- A Tuesday club where people bring a book and a biscuit.
- A children’s hour, run by a bookseller who gave up the evenings of her retirement.
- A small repair desk for the town’s broken lamps, radios and chairs.

> We did not set out to build a library. We set out to stop a roof leaking, and the rest followed.

## What it cost, and what it gave

The total bill came to a little under what the council had budgeted for a single year of keeping the doors closed. Most of it was materials. Almost none of it was labour, because almost all of that was given.

The deeper return is harder to count. The volunteers talk about a sense of knowing their neighbours that they did not have before. A teenager who came to fix shelves now runs the Saturday desk. A widower who had not left the house much now arrives early to put the kettle on.

!30 | The new reading nook, finished last spring.

## Looking ahead

The library now opens six days a week and has a waiting list of people who would like to help. The roof, for the record, has not leaked in three winters. Ines Varga, asked what she is proudest of, said she was proudest of the joinery, then corrected herself, and said she was proudest of the Saturdays.`,
        },
        {
          t: 'Five small habits of people who finish things', s: 'None of them are dramatic. All of them are repeatable.', sec: 'Work', by: 5, lead: false,
          body: `People who finish things are not, on the whole, more disciplined than the rest of us. They have simply arranged their days so that finishing is the easy path. We asked a handful of writers, builders and gardeners what they actually do. The answers were less glamorous than expected, and more useful.

- **They decide where the end is.** Before starting, they say what done looks like, in a sentence. A chapter, a shelf, a bed of tulips. Without it, a project has no edge, and what has no edge cannot be finished.
- **They begin in the same place every day.** The same chair, the same lamp, the same first ten minutes. The ritual is not magic. It simply removes the daily decision about where to start.
- **They stop in the middle.** A surprising number leave the last sentence unwritten at the end of the day, so that tomorrow begins with something easy.
- **They keep a short list.** Three things, not thirty. A long list is a way of feeling busy. A short one is a way of getting finished.
- **They tell someone.** Not a crowd, just one person. The promise to a friend is a quiet, steady pressure that no app has managed to replace.

> Finishing is mostly a matter of making the next step too small to refuse.

None of this is dramatic, which is rather the point. The habits are small enough to try this afternoon, and gentle enough to keep.`,
        },
      ],
    },
    {
      id: 'lumen', name: 'Lumen', cat: 'Science',
      stories: [
        {
          t: 'What a quiet morning does for the mind', s: 'Researchers say the first hour of the day shapes the other fifteen.', sec: 'Mind', by: 0,
          body: `The first hour after waking is quieter than it looks. Cortisol is high, attention is fresh, and the mind has not yet been handed the day’s demands. What fills that hour tends to colour the rest.

In a small study, volunteers spent twenty minutes each morning with a book, a notebook or a window. Compared with a group who began with messages, they reported feeling less rushed by lunchtime. The effect was modest but steady.

## What the researchers measured

Over six weeks, the team asked participants to rate their mood and sense of control at noon and again at six. They also recorded how many times each person checked a device before nine o’clock.

!31 | A volunteer’s morning notebook, one of the study’s simplest tools.

Those who started the day quietly checked their phones about a third as often before nine, and they rated their afternoons as more manageable. Nobody became a different person. They simply described the day as something they were in, rather than something that was happening to them.

> The day felt like something they were in, not something happening to them.

## Careful claims

The researchers are careful about what they claim. Sleep, work and family all matter more. The study was small, the volunteers knew what was being tested, and a few weeks is not a lifetime. But the habit is cheap, needs no equipment and, in their words, is easy to try and easy to drop.

## How to try it

- Pick twenty minutes, and protect them for a week.
- Choose something gentle: a book, a notebook, a window, a cup of tea.
- Leave the phone in another room until the twenty minutes are done.
- Notice how noon feels, and write it down.

Most participants kept at least part of the habit after the study ended. A few described it, with some surprise, as the part of the day they would miss most.`,
        },
        {
          t: 'The harbour seals that learned to wait for the tide', s: 'A colony off a northern coast has changed its whole schedule, and nobody told them to.', sec: 'Nature', by: 1,
          body: `Naturalists have long noted that animals keep schedules we rarely see. Tides, light and temperature set a rhythm, and the animals that follow it closely tend to waste less effort. On one northern coast, that rhythm has recently shifted, and a colony of seals has shifted with it.

Observers have counted the animals each dawn for three seasons. As a channel silted up and the tide arrived later, the colony moved its resting hours by almost forty minutes.

## A change nobody planned

The channel is the key. It once filled early, giving the seals an easy slide onto the sandbank. As the silt built up, the water arrived later each day, and the animals that came down at the old hour found themselves struggling over mud.

!32 | The sandbank at low water. The seals now arrive well after this view.

Within a season, the colony’s habits had changed. Seals that waited for the right water spent less time heaving across the flats and more time resting in the sun, which is the other thing seals are good at.

## How it spread

Nobody is certain how the change travelled. The older seals may lead and the younger ones copy, or each animal may simply feel the water rise at the same moment and move. What the records show is patience.

> What the records show is patience.

## Why it matters

Researchers say stories like this are a useful reminder that living things adapt in ways that look unremarkable from a distance and wonderful up close. They are also a practical warning, because the same silting is happening along other coasts, and animals that cannot adjust may not do as well.

For the people who count the seals each morning, the lesson is simpler. Keep watching. The patterns they have noticed would have been missed in a single season, and the best records of this kind have always belonged to someone willing to turn up every day.`,
        },
        {
          t: 'How a single oak keeps a whole valley warm', s: 'Ecologists traced the heat, the shade and the insects around one very old tree.', sec: 'Nature', by: 2,
          body: `The oak at the head of the valley is about four hundred years old, and ecologists have spent two summers measuring what it does. The short answer is a surprising amount.

The long answer starts with shade. In July, the ground beneath the crown is up to eight degrees cooler than the open field next to it. In January, the same ground is warmer by almost three, because the branches hold the heat that the earth gives off at night.

## A small climate of its own

Sensors placed along a line from the trunk to the field showed the pattern clearly. Close to the tree the temperature stays steady. Further out it swings more widely with the weather.

!33 | Temperature sensors along the line from trunk to field.

That steadiness is a gift to everything that lives nearby. Moss, fungi, small mammals and a great many insects use the oak’s patch as a refuge, and some of them travel out into the valley from there.

> One old tree can hold a whole neighbourhood together.

## The insect count

The team counted more than a thousand species of insect in and around the tree, including several that were not known in the valley before. Birds follow the insects, and a pair of owls has nested in a hollow limb for at least twelve years.

## What this means for the valley

The farmers who graze the nearby fields say they have noticed the effect for years. Lambs shelter under the crown in spring storms. A neighbouring orchard blossoms a little earlier than those further away.

- The tree cools the ground in summer and warms it in winter.
- It supports more insect species than any other single point in the valley.
- It acts as a stepping stone for animals moving between woods.

The researchers’ main recommendation is a simple one. Protect the old trees, and plant the young ones close beside them. The valley will take care of the rest, though it will need about four hundred years.`,
        },
        {
          t: 'Why the best maps are still drawn by hand', s: 'Cartographers explain what a person notices that software leaves out.', sec: 'Craft', by: 3,
          body: `In a quiet studio above a stationer’s shop, a cartographer named Priya Nand is drawing the coast of a bay she has walked eleven times. She works with a fine pen, a lamp and a ruler worn smooth by years of use. She could produce the same map in an afternoon with software. She will take three weeks, and she says the three weeks are the point.

## What a hand notices

Software draws what the data says. A person draws what she sees, and in between the two lie a great many small decisions. Which footpath is really used, and which only exists on paper? Which stream dries up in August? Which stile is so overgrown that no walker would choose it?

!34 | A hand-drawn chart of the bay, in progress.

A good hand-drawn map makes those decisions visible. It leaves out the lane nobody walks and emphasises the shortcut everybody takes. It is, in a sense, an opinion about a place, made by someone who cares about the answer.

> A map is an opinion about a place, made by someone who cares.

## The craft

The work is slow. A single sheet is planned in pencil, inked in sections and then checked, usually by someone who knows the ground. Lettering alone can take days, because every name must sit where it is easy to read and hard to confuse.

## Why it still matters

Most maps people use today are made by machines, and they are very good. The people who draw by hand are not trying to compete. They say their work is about a different kind of usefulness: the sense of a place that a careful eye can give.

Walkers who use her maps say they notice the difference. They find they look up more. They can tell, at a glance, where a good place to stop might be. And on the long walks, they say, the map feels less like an instruction and more like company.`,
        },
        {
          t: 'The night sky is getting dimmer, and here is what helps', s: 'A few simple changes to street lighting have brought the stars back to one small city.', sec: 'Space', by: 4,
          body: `For most of human history, a clear night meant stars. In much of the modern world, it now means a dull orange glow. Researchers estimate that the night sky is brightening by several per cent every year, and in some places the Milky Way has not been seen in a generation.

In one small city, that is starting to change. Over three years, the council replaced its harsh streetlights with warmer, shielded ones that point down instead of out. Residents report a darker sky, and astronomers confirm it.

## What was changed

!35 | The same street before and after the new lamps. The glow above the rooftops is gone.

The changes were modest. The new lamps are lower in power and warmer in colour. They carry shields so that light falls on the street and not the clouds. A few are fitted with sensors that dim them in the quiet hours.

> The best light is the light that lands where it is needed.

## The results

Measurements from a rooftop sensor show the sky above the city is about a third as bright as it was. On clear nights, the brightest stars are easy to see, and on the darkest evenings a faint band of the Milky Way has begun to appear above the hills.

## What you can do

You do not need a council to help. Households can make a difference with a few small choices.

- Fit outdoor lights with shields, and point them downward.
- Choose warm colours over cool white.
- Turn lights off when they are not needed.

The astronomers who studied the city’s lights say that the change cost less than expected and saved money on power. They are careful to add that it is also a pleasure, and that on a quiet night there is nothing quite like being able to look up.`,
        },
        {
          t: 'A short history of the humble kettle', s: 'From hearth to hotplate, the story of how a nation learned to pause for tea.', sec: 'History', by: 5,
          body: `The kettle began as a pot that happened to sit near a fire. For centuries it was copper or iron, heavy and slow, hung on a hook above the coals. It boiled water, and a great deal of patience went with it.

The first big change came with the stove, which let a pot sit on a flat surface and heat more evenly. Whistles followed in the nineteenth century, a small invention that saved countless pans from boiling dry.

## The electric kettle

Electric kettles arrived early in the last century and were at first a curiosity. The first models were slow, and the element sat in the water in a way that made cleaning difficult. A generation of tinkering made them quicker and safer.

> The kettle is the one appliance that has never asked for attention.

## A small ritual

Over time, the kettle took on a role that no engineer had planned. It became a signal for a pause. The sound of the water rising is, for many people, the start of the working day, the break after lunch or the first quiet moment after the children are in bed.

Historians say there is nothing accidental about that. A device that takes three minutes to do its job builds a gap into a day, and people learn to fill the gap with something other than work.

## The modern kettle

Today’s kettles are efficient, quiet and sometimes clever, with temperature settings for different teas. But the best of them still do the one thing the old pots did. They give you a reason to stand still for a moment, and look out of the window.`,
        },
      ],
    },
    {
      id: 'harbor', name: 'Harbor', cat: 'Places',
      stories: [
        {
          t: 'The harbour that learned to run on tides', s: 'Engineers and fishermen built something neither expected.', sec: 'Energy', by: 0,
          body: `The harbour at Marrow Bay sits at the end of a long, shallow inlet, and for most of a century its tides were a nuisance. Boats waited for water, and water came and went on its own timetable. Then, one winter, someone at a harbour meeting asked a question that sounded like a joke. If the tide was going to arrive twice a day regardless, could it do something useful while it was here?

What followed took six years, a great deal of tea and a surprising amount of patience. It also changed how a small town thinks about its own shoreline.

## A plan that began as a joke

The idea was taken up by a small team: two engineers from the nearby university, three fishermen and a retired teacher who kept the minutes. None of them thought of themselves as pioneers. They thought of themselves as people with a problem and a good deal of water.

!24 | The harbour wall at Marrow Bay, from the old fish quay.

They spent two winters on the plan. It was not fast, and it was not glamorous, but it was carefully done. The first task was simply to measure: how high the water rose, how fast it moved, and where the channel carried it.

> Anything in the water is something to catch a net on, so we moved the units twice.

## The fishermen’s rules

The fishermen were wary at first, and with reason. Gear in the water snags nets and can sink a boat. They set three rules that the engineers agreed to before a single bolt was turned.

- Nothing in the main channel. Units go where boats do not.
- Everything must be visible at high water and marked at low.
- The fishermen have the final say on any change to the layout.

The team moved the first unit twice at the fishermen’s suggestion, until everyone could work around it. It was an early lesson in the value of asking the people who actually use the water.

## The first turbine

The first unit was no bigger than a garden shed. It turned slowly and quietly, and it powered the lights on the pier. People came to look at it as they might look at a new bridge.

!25 | The first unit being lowered into position, with half the town watching.

The first Saturday it ran, the whole town watched the pier lights come on. There was applause, then a minute of silence, and then someone suggested a cup of tea, which was how most events in Marrow Bay were concluded.

## Growing carefully

Over the next four years, more units followed. Each was added only after a season of measurements, and each went to a place agreed with the fishermen. The team published its figures openly, including those that did not look good.

By the fifth year, the harbour was producing enough power to keep its own lights burning and to sell a little back. The numbers are modest, but every household on the front reports the same thing: the bills are steadier.

## What the town says

Ask anyone on the front what they are proudest of, and they rarely mention the power. They mention that first Saturday. They mention the way the project drew together people who rarely spoke. They mention the plaque by the slipway.

There is a plaque now. It lists the names of everyone who helped, including the teacher, who insists on being called a retired teacher and not an engineer. She keeps the minutes still, in a green notebook, and says that the secret of the whole thing is the minutes.

## The numbers, honestly

The team has always published its figures, including the awkward ones. In the first year, the units produced about two thirds of what the engineers had hoped. A silt build-up in the channel cost them a month. A cold snap iced a sensor and stopped one unit for a week. A fishing boat caught a line in a mooring cable, and nobody has ever been quite sure how.

The second year was better. The units were moved, the sensors were fitted with heaters, and the fishermen suggested a change to the marker buoys that made them far easier to see at dusk. By the third year the harbour was producing a little more than the original estimate, and the engineers wrote in their report that the credit belonged to people who had never done a calculation in their lives.

!27 | The measurement log, kept in pencil by the retired teacher.

Costs were modest by the standards of such projects, and most of them were borne by a grant that the town had very nearly not applied for. Volunteers provided much of the labour. A local boatbuilder supplied moorings at cost. The team is cautious about comparing the project with larger schemes, and says that its main achievement is not the power but the proof that a small place can do something careful and lasting.

## A winter storm

The real test came in the fourth winter, when a storm blew in from the north-east and drove a wall of water up the inlet. Several boats broke their moorings. The pier was closed for two days. The town held its breath.

When the water went down, the units were still in place, and still turning. A few markers had been bent. One cable had worn. But nothing had failed, and the lights on the pier, which had gone out for an hour during the worst of it, came back on by themselves.

The harbour master, a quiet man who does not say much at meetings, was asked afterwards how he felt. He said it was the first time in thirty years he had watched a storm and not worried about the electricity. Then he went back to checking the moorings, and did not mention it again.

There is a small shed on the quay now, painted the colour of the fishing boats, where the team keeps its tools and its tea. Visitors are welcome to look in. On the wall hangs the first sketch of the project, drawn on the back of a harbour-meeting agenda, with a question mark beside the turbine and a note in the retired teacher’s hand: ask the fishermen first.

## Would it work elsewhere?

Visitors ask whether the idea would work elsewhere. The honest answer, the team says, is sometimes. Every coast has its own tide, and every town has its own patience. A site needs a strong, regular flow, a sheltered channel and, above all, people willing to measure carefully before they build.

They have shared their notes with three other harbours. One has begun a trial. Another has decided, after a year of measuring, that its tides were too weak, and counted the year as well spent.

!26 | Dawn at the pier. The lights run on the tide.

## The evenings

In the evenings, the turbine’s hum mixes with the gulls, and people sit on the wall with something warm to drink. Nobody quite planned that part, but it has become the best of it. The hum is steady and low, a sound that the town has come to find reassuring, in the way that people grow fond of a clock.

Younger residents have taken to it too. The school visits each spring, and the children are shown the units from the pier and asked to guess how much power each makes. Most guess far too much. They are then taken to the harbour office, shown the logbook and allowed to write the day’s reading in pencil, which is, by common agreement, the best part of the trip.

At the end of a long day, a fisherman named Tom Ashby sits on the slipway with a flask. He says he used to listen for the weather. These days, he says, he listens to the harbour, and the harbour has been saying the same quiet thing for years: that the water will come, and that someone will be ready for it.`,
        },
        {
          t: 'How a village taught itself to bake again', s: 'Flour, patience and one very old oven.', sec: 'Food', by: 1,
          body: `When the village bakery closed, the nearest loaf was eleven miles away. For a year, people drove. Then someone noticed that the old bread oven behind the chapel hall was still there, and that nobody had checked whether it worked.

It did, more or less. It had a crack down one side and a chimney full of jackdaws’ nests, but the brick was sound. A group of neighbours spent a month clearing it, and on a cold Saturday in March they lit it for the first time in forty years.

## The first loaves

The first bakes were, by general agreement, disappointing. Some loaves were raw in the middle. Others were burnt on the base. A retired postwoman who had not baked since the seventies said she had forgotten everything, then went home and baked a perfect one the next day.

!27 | The oven behind the chapel hall, lit for the first Saturday bake.

The group learned from each other, and from a baker three villages away who agreed to come and watch. He changed their method in a single morning. Cool the oven a little longer, he said, and give the dough time.

> Give the dough time, and it will forgive you almost everything.

## A weekly habit

By summer, the Saturday bake had become a fixture. A dozen people arrived at six, kneaded in turns and shared the tasks. By nine, the first loaves were out, and the hall smelled the way a village ought to.

- Sourdough, from a starter that has been fed since the first week.
- A soft white loaf for the school.
- Seeded rolls, sold in bags of six at the gate.

## What it did for the place

The bake was never meant to make money, and it does not. The loaves are sold at cost, and what is left covers the flour and the firewood. But the village has a new kind of Saturday, and it has people who know each other better than they did.

The oldest baker, aged eighty-one, now teaches children from the school on the last Saturday of every month. He says he is not sure he is teaching them to bake. He says he is teaching them to wait, and that this may be the more useful lesson.`,
        },
        {
          t: 'The night market that keeps its own clock', s: 'Stalls open at ten, close at dawn, and nobody has ever needed a sign.', sec: 'Culture', by: 2,
          body: `The night market begins at ten, though nobody has ever been able to say who decided that. By half past, the lanterns are lit, the first pans are hot and the long street is filled with the smell of ginger and charcoal.

It runs until dawn. By the time the sky is grey, the stalls have been wiped down, the lanterns are out and the street has returned to being a street. There are no signs. There never have been. Everyone who comes knows where to go.

## A market with its own habits

The vendors describe an unwritten set of manners. The oldest stalls sit at the top of the street and take the best corners. Newcomers begin at the bottom and work their way up, one season at a time. Nobody undercuts a neighbour, and anyone short of change is quietly helped.

!28 | The lanterns go up at nine and come down at dawn.

Visitors are welcome, but they are expected to behave like guests. That means arriving hungry, asking before taking photographs and finishing everything on the plate.

> Nobody ever needed a sign. You follow the smell.

## What is on offer

The food changes with the season, but a few staples never leave. There is a noodle soup cooked in a pot that is older than the street. There are skewers of grilled mushroom, sweet buns still hot from the steamer and a dark tea served in tiny cups.

- Noodle soup, from a pot that has not been emptied in forty years.
- Grilled skewers, flavoured with a pepper the vendor keeps secret.
- Sweet buns, sold out by midnight on most nights.

## Why it lasts

The market has survived rent rises, rain and a great many changes in the neighbourhood. Its vendors say that the secret is its hours. By being open when almost nothing else is, it has become a place for people who work late, keep odd hours or simply cannot sleep.

For many of them, it is also a kind of living room. They come for the soup and stay for the company, and when the dawn arrives and the lanterns go out, they walk home with the pleasant sense of having been somewhere that was entirely, quietly theirs.`,
        },
        {
          t: 'A walking route that follows the old canal', s: 'Twelve gentle miles, three good cafés and one very opinionated heron.', sec: 'Travel', by: 3,
          body: `The old canal has not carried a boat in sixty years, but it still goes somewhere. A flat, easy path follows its bank for twelve miles, from the stone bridge at Linden Row to the lock at Whitsun Mill, and it makes one of the quietest walks in the county.

The path is wide enough for two, level enough for a pushchair and shaded for most of the way. In spring, the banks are thick with primroses. In autumn, the water is covered in fallen leaves, and the whole route takes on the colour of old brass.

## The route

!29 | The towpath near the second bridge, in early spring.

You can walk the whole thing in a long afternoon, or break it into three easy sections. Each has its own character, and each ends somewhere you can sit down.

- **Linden Row to the Willow Bridge (4 miles).** Open fields, a few farm gates and a long straight reach where the water is mirror-calm.
- **Willow Bridge to the Mill Pool (4 miles).** The woodland section. Quiet, shady and full of birdsong.
- **Mill Pool to Whitsun Mill (4 miles).** Gentle bends, a flight of old locks and the best view of the whole walk.

## Where to stop

There are three good cafés on the way, all within a few steps of the path. One is in a converted lock-keeper’s cottage. Another is on a barge that has not moved since the nineties. The third sits at the end, with a garden, a dog and cake that deserves a short detour.

> The towpath is the one road in the county where nobody is in a hurry.

## A word about the heron

You will meet the heron, probably more than once. It stands in the shallows near the second bridge and looks at walkers with open contempt. Locals say it is the same bird that has stood there for years. It will not move, no matter what you do, and the polite thing is to walk around it.

Bring comfortable shoes, a little water and an unhurried mind. The path asks for nothing else, and gives a good deal back.`,
        },
        {
          t: 'Why every town should have a clock tower', s: 'A planner’s case for the oldest public gadget of all.', sec: 'Cities', by: 4,
          body: `Walk through the centre of almost any old town, and sooner or later you will look up. There, above the market or the station or the square, will be a clock. It will be slightly wrong, and nobody will mind.

A planner named Jonas Reed has spent a career arguing that every town should have one. His case is simple, and it is not about the time.

## A shared moment

A clock tower, he says, is the original public gadget. It tells everyone the same thing at the same moment. In an age when every phone has its own time and every person has their own schedule, a shared clock is a small act of togetherness.

!30 | The market square clock, which runs about four minutes fast.

It also does something that screens rarely do. It gives people a reason to look up, and to see the town around them.

> A clock is a promise that we are all in the same hour.

## What it needs

A tower does not have to be grand. It needs to be visible from the places where people gather, and it needs to be kept. A clock that is stopped or neglected sends the opposite message, and towns that have let theirs run down tend to find that it does something to morale.

## A few small suggestions

- Place it where several streets meet, so it can be seen from all of them.
- Light it softly at night, so that the hour is visible after dark.
- Let it strike, gently, on the hour. People will complain for a week and miss it forever after.

The planner admits that the idea is old-fashioned. That, he says, is rather the point. Some things stay useful because they were right to begin with.`,
        },
        {
          t: 'The last ferry of the season', s: 'On the final crossing, the regulars bring cake.', sec: 'Travel', by: 5,
          body: `The ferry from Sable Point to the island makes its last crossing of the year on the final Friday in October. It leaves at ten past four, as it always does, and it is nearly always full.

By tradition, regulars bring cake. There are carrot cakes and lemon cakes and one dense fruit cake that has appeared every year for more than a decade, wrapped in a tea towel and handed round with a plastic knife. Nobody organises it. It just happens.

## The crossing

The crossing takes forty minutes, long enough to see the whole coast slide past. The light that afternoon is usually low and gold, and the sea is calm. A few passengers stand at the rail with flasks. Others sit inside, where the heaters hum and the windows steam.

!31 | The ferry leaving Sable Point on its last run of the year.

Many of them know one another from years of crossings: the nurse who commutes each week, the schoolchildren who ride on Mondays and the man with the accordion, who is asked, every year, to play something and, every year, pretends to refuse.

> We do not say goodbye to the summer. We just have cake.

## What the island does next

When the ferry stops, the island changes. The cafés close. The path to the lighthouse is left to the wind. A few hundred people stay on through the winter, and for them the crossing becomes a smaller thing: a weekly boat, weather permitting.

- The shop keeps a stock of everything that does not spoil.
- The lifeboat crew trains on Sunday mornings.
- The school holds its carol service in the harbour hall.

## Last off

On the final run, the captain waits at the island pier until the last passenger is off. This year, she said, she would wait for the cake as well. It came down the ramp wrapped in a tea towel, and the whole boat applauded.

By six, the lights of the island were small and gold across the water. The ferry turned for home, nearly empty, and the captain said she liked the winter. It was, she said, the part of the year when people remembered how to be kind to one another.`,
        },
      ],
    },
    {
      id: 'atlas', name: 'Atlas', cat: 'Ideas',
      stories: [
        {
          t: 'Reading the new tide tables', s: 'The year’s numbers are out, and they say more about us than about the sea.', sec: 'Society', by: 0,
          body: `Every autumn, a slim booklet of numbers arrives at harbour offices, boatyards and a surprising number of kitchen tables. It is the tide table for the coming year, and for people who live by the sea, it is the nearest thing to a calendar of their lives.

This year’s edition has some changes. The highest tides of the year are slightly higher. The lowest are slightly lower. The ordinary tides, the ones that carry fishing boats out and back, are unchanged, which is a comfort.

## What the numbers mean

!32 | A page of the new tide tables, annotated by the harbour master.

A tide table is a prediction, and an old one. It is built from centuries of measurement and the careful arithmetic of the moon and sun. Its makers say the work is quiet, repetitive and rarely thanked.

> A tide table is a promise made by the sky.

## Why they still matter

You might think that phones had made the booklet redundant. Many harbour workers disagree. A printed table does not need a signal. It lies flat on a chart table. It can be checked at a glance, and written on, and kept in a pocket that gets wet.

## A few things worth knowing

- The highest tides fall around the new and full moons.
- Weather can make a real tide differ from its prediction by several inches.
- A table is always for one place. Nearby harbours may differ by an hour or more.

The booklet’s editor says he likes to think of it as a letter to the year ahead, written in numbers. He admits that nobody reads it for the prose, and that the prose is not the point.`,
        },
        {
          t: 'Why we still print the weather', s: 'In an age of alerts, the little box on the back page refuses to die.', sec: 'Media', by: 1, lead: false,
          body: `Every few years, a newspaper editor somewhere decides that the weather box on the back page is no longer needed. Phones, after all, can tell you the weather in real time. Every few years, the letters arrive within a week, polite and firm, asking where the little box has gone and when it will be back.

What readers value, it turns out, is the shape of it. Today, tomorrow, the day after. A glance, a nod, and the day can begin. No notification can do quite the same.

## A small, dependable thing

The box is usually no more than a few lines. A symbol, a temperature, a short sentence about the wind. But it does something that an app does not. It tells you what the weather will be, in the same place, every day, with no need to open anything.

> People do not only want information. They want it arranged so that they can stop looking at it.

## What editors have learned

Those who have tried removing the box say the complaints are some of the most heartfelt they receive. They are not about accuracy. They are about habit. Many readers have looked at the same square of the page for decades, and miss it when it is gone.

## A lesson for designers

There is a lesson here for anyone designing anything. A good small piece of information is usually a calm one. It has a fixed place, a short form and a clear end. It lets you take what you need, and then it lets you go.

The weather box has survived every redesign for exactly that reason. It does its job and steps out of the way.`,
        },
        {
          t: 'The case for a slower commute', s: 'Two cities tried longer, calmer routes. Riders were surprised by what they gained.', sec: 'Cities', by: 2,
          body: `The usual advice about commuting is to make it shorter. Two cities recently tried something different. They offered riders a longer, calmer route, and tracked what happened.

The routes added about ten minutes each way. They ran along the river, through a park and past a row of old market stalls. They were slower, and quieter, and by the end of the trial, most riders did not want to go back.

## What the riders said

Surveys at the start and end of the trial showed a clear pattern. Riders on the slower routes reported feeling less stressed on arrival. They described their journeys as more pleasant, and they were, to the surprise of the researchers, no less punctual.

!33 | The river route in the early morning, with fewer cars and more cyclists.

Several said they had started to enjoy the commute for its own sake. One described it as the only part of the day that belonged to her.

> The ten minutes we lost were the ten minutes we needed.

## Why it worked

Planners suggest that the benefit has a simple cause. A shorter route is often faster because it is busier. A longer one can be calmer, and calm is easy to underrate. Fewer stops, fewer junctions and fewer other people hurrying can add up to a better start to the day.

## Some practical findings

- Routes with some greenery were rated far higher than routes without.
- Riders who could read or think on the way did so far more often.
- Journeys with a clear, steady pace felt shorter than they were.

## What cities can do

The cities involved say the changes were cheap. A few signs, a few safer crossings and a more frequent service were enough. They are now looking at other routes, and at other kinds of journeys.

For commuters, the lesson may be simpler. Sometimes the best way to improve a journey is not to hurry it. It is to make it one you would not mind taking.`,
        },
        {
          t: 'What libraries know that apps do not', s: 'A librarian on the quiet craft of putting the right book in the right hands.', sec: 'Culture', by: 3,
          body: `On a wet Tuesday afternoon in a mid-sized city, a librarian named Priya Nand stands at a desk by the door and watches people come in. She has done this work for twenty-six years. Asked what she has learned, she thinks for a while and then says something that surprises us: the best thing a library does is not to give people what they asked for.

It is to give them something they did not know they wanted.

## The shelf by the door

Near the entrance, she keeps a small shelf. Nothing on it is new, and nothing is famous. Every title has been chosen by a member of staff who loved it and wanted to pass it on, and each carries a short handwritten note.

!34 | The shelf by the door, refilled every Monday.

The shelf is emptied weekly. Regulars say that Monday is their favourite day, though they are careful not to say so too loudly, in case it changes.

> The best service is the moment someone leaves with a book they did not expect to want.

## What a catalogue cannot do

Libraries have catalogues, of course, and good ones. But a catalogue answers questions. It does not ask them. A librarian who knows her readers can say, without being asked, that you might like a certain novel, or a certain book of walks, or a very small book of poems.

She describes the work as a kind of slow conversation. It happens over months or years, and it is built from small things: a glance at what someone is carrying, a remark about the weather, a reader’s face when a particular title comes up.

## What apps get right, and wrong

She is not against technology. Her library lends e-books and runs a booking system that she praises. But she says the logic of most apps is different from the logic of a library.

- An app tries to keep you. A library hopes you will go home.
- An app learns what you click. A library learns who you are.
- An app serves the next thing. A library lets you finish.

## A day at the desk

The hours between two and four are quiet. A man in a raincoat returns a cookbook and asks, shyly, for something about birds. A girl of nine arrives with her grandfather and asks whether there is a book about a dog who can fly. There is, as it happens, and the librarian walks them to it herself.

By half past four, the light in the windows has turned grey, and the lamps come on. The librarian tidies the shelf, writes a few notes and tucks them into the front covers.

## A Saturday in the children’s section

On Saturday mornings, the children’s section fills up. Parents sit on low chairs with the expression of people who have been told they may relax and do not entirely believe it. Children disappear behind shelves and reappear with armfuls.

!35 | The children’s section on a Saturday, before it fills up.

The librarian who runs it is a former primary teacher called Ines Varga. She does not tell children what to read. She asks what they like, then walks them to a shelf and says, very quietly, that she thinks they will enjoy the third one along. She is right about nine times in ten, and she says the tenth is how she learns.

A boy of seven told her last month that he did not like reading. She asked what he did like. He said volcanoes. She handed him a book on volcanoes, a book of poems that happened to contain one volcano, and a very old comic about an island that exploded. He has been back every Saturday since.

## What the catalogue cannot see

The library’s catalogue is a good one, and the staff are proud of it. But it can only tell you what the library holds. It cannot tell you what a person is looking for when they do not yet know.

Priya Nand says that this is where most of the real work begins. A reader asks for a book on gardening, and a good librarian asks whether it is for a window box or a field. A reader asks for something to cheer them up, and a good librarian does not reach for a joke book. She reaches for something kind.

> A catalogue answers questions. A librarian hears the one underneath.

None of this can be easily measured, which is one reason libraries are hard to defend in a budget meeting. Priya says she has stopped trying to defend them with figures. She invites the people who ask to come and spend a Saturday.

## The people who run it

The staff is small: four full-time, six part-time and a rotating band of volunteers who arrive with tea and stay for the afternoon. They meet every Monday morning to talk about what people have been asking for, and to choose the titles for the shelf by the door. Nobody takes minutes, because, as one of them says, the minutes would make it sound like a meeting.

The conversation is the work. A volunteer who spent the weekend reading a collection of letters says that she thinks it would suit a man who came in on Thursday. A part-timer mentions a girl who keeps asking about space. Someone remembers a book that has not been borrowed in a decade and suggests moving it to the front.

The library’s opening hours were set, years ago, by a committee that no longer exists. They have never been changed, because nobody has had the heart. The doors open at nine and close at five, with a long lunch on Wednesdays, and regulars arrange their weeks around them in much the way that people arrange theirs around the tide. When a visitor once asked whether the hours might be extended, a volunteer replied that it would be a pity to rush people, and the subject has not been raised since.

On wet afternoons, when the reading room is full and the windows are steamed, the librarian likes to stand at the back and listen. It is not silent, whatever people imagine. There is the scratch of pencils, the murmur of a grandfather reading aloud, the squeak of the trolley and the soft thud of a returned book. She says it is the best sound she knows, and that she has never once managed to describe it to anyone who has not stood in the room.

## What she would change

Asked what she would change if she could, she thought for a long moment. She said she would not change much. The room, she said, was good. The books were good. The staff were better than good.

!35 | The reading room at closing time.

Then she smiled, and said that she would like more chairs. People sit longer than they used to, she said, and nobody has ever asked them to leave. She hoped that was a sign of something, and she hoped it would never stop.

## The wider lesson

For anyone building a tool to help people read, there is something to learn from a woman at a desk by the door. The quiet hours matter. So does the sense of being known, and the gentle art of letting someone leave satisfied rather than hooked.

One of the volunteers, a retired bus driver, says that he first came in to read the newspapers and stayed because nobody asked him to leave. He now runs the Tuesday club, and says he is not sure when he became the sort of person who runs a club. He suspects, he says, that it was somewhere between the second cup of tea and the third book.

A library, she says, is a place that is trying to be finished with you in the best possible way. It hopes you will take what you need and go on with your life. And if you come back tomorrow, she says, so much the better, and there will be another small shelf waiting.

> A warm room, a kind desk, a good shelf, and enough time. It is slow work, and it keeps turning out to be exactly what people need.`,
        },
        {
          t: 'The letters nobody sends anymore', s: 'A postal worker on the small, specific joy of a handwritten address.', sec: 'Society', by: 4,
          body: `On a quiet round in the north of the city, a postal worker named Leo Marsh has noticed something. The letters are fewer, and the ones that remain are different. They tend to be handwritten, and they tend to matter.

He has delivered post for nineteen years, and he says he can usually tell what is in an envelope before it is opened. The thick cream ones are invitations. The thin blue ones are bills. And the ones addressed in careful ink, with a stamp stuck on slightly crooked, are almost always from someone who cared enough to sit down.

## A small, specific joy

There is a pleasure, he says, in the handwriting alone. A person’s hand tells you something about them before a single word is read: hurried or patient, firm or shy, young or old.

!35 | A shoebox of letters kept by a customer on his round.

He recalls an elderly woman on his route who receives a card every month from a friend overseas. She waits for him at the gate, and says that she cannot say what she likes best about it. He says he cannot either, but he understands.

> You cannot reply to a letter in a second, and that is exactly what makes it worth getting.

## Why people still write

Letters are slower than anything else we use. That slowness, writers say, is part of the point. A letter is composed. It cannot be taken back, and it does not arrive in the middle of something else.

- It is read once, carefully, often at a quiet time of day.
- It can be kept in a drawer, and found years later.
- It says, simply, that someone sat down.

## What he would like

Asked what he would like people to know, he said he would like them to write one letter this year. Not a long one. Just a few lines, to someone who would not expect it.

He said he could promise one thing. It would be delivered, on foot, in all weathers, to the right door, by a man who is always glad to carry it.`,
        },
        {
          t: 'How to read a newspaper from a hundred years ago', s: 'A guide to the adverts, the odd headlines and what they quietly tell us.', sec: 'History', by: 5,
          body: `A newspaper from a hundred years ago is one of the best time machines we have. It is cheap, it is detailed and, if you know how to read it, it will tell you a great deal more than the editor ever meant.

Archives now hold millions of pages, and a good many are free to browse. But they are not easy to read at first. The type is dense, the headlines are long and the order of things is not the one we expect. A little preparation helps.

## Start at the back

Most experienced readers begin with the advertisements. They are the least edited part of the paper, and they say the most about ordinary life. What did people buy? What did they fear? What did they hope for?

!24 | A page of small advertisements, which tell their own story.

A column of small notices might offer lodging, lost dogs, medicines and music lessons. A single page can give you a sketch of a town.

> The headlines tell you what the editor thought mattered. The adverts tell you what people did.

## Read the headlines as a poem

Headlines of the period are long and strangely formal. A single story may have five lines of them, each in a different size of type. They were designed to be read from across a room, and they often contain the whole story in miniature.

## How to read a page

A few habits will make your first visit easier.

- Read the front page last. It is the part most likely to be about the famous events.
- Notice the weather, the prices and the shipping news.
- Look for small human items, such as births, weddings, lost property and local quarrels.
- Pay attention to what is missing. Silence can say a great deal.

## What you will find

You will find that people were, in most ways, just as we are. They worried about money, argued about roads and enjoyed a good joke. The jokes, you may be surprised to learn, are often still funny.

You will also find the occasional startling detail: a recipe for a dish nobody makes any more, a notice about a lecture on a subject that sounds absurd or a small advertisement for a service that has long since vanished.

!35 | The shipping column, with arrivals and departures from a dozen ports.

## A good way to spend an afternoon

Choose a day that means something to you: a birthday, an anniversary, the day your family arrived somewhere. Find the paper for that day. Read it from the back to the front, slowly, with a cup of tea. You may find, as many do, that you have wandered into a different century and are not entirely in a hurry to come back.`,
        },
      ],
    },
  ],
};
