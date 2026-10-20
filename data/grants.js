/*
  Fertility Grant Finder — grant data
  ------------------------------------
  This is the only file you need to edit to update grants. See UPDATING.md.

  Rules this file follows (from the project brief):
  - Every application cycle is its own record inside "cycles". Never edit an old
    cycle's dates to make it a new year. Add a new cycle instead.
  - Unknown values are null. The site shows "Not announced" / "Not yet verified".
  - A date object looks like:
      { "date": "2027-03-04", "time": "17:00", "tz": "America/New_York", "tz_label": "ET" }
    or, when only the month is known:
      { "month": "2027-03" }
    Optional keys: "note", "confidence" (overrides the cycle's), "alternatives"
    (other dates shown by other official pages — used when sources conflict).
  - date_confidence values:
      confirmed           explicit date with a year on an official source
      month_only          explicit month and year, day not announced
      needs_confirmation  official sources conflict or are incomplete
      recurring           a published repeating schedule, not confirmed for this year
      historical          past information kept for reference
      not_announced       nothing published yet
  - kind values:
      dated     a cycle with (some) announced dates
      rolling   applications accepted year-round
      awaiting  the next cycle has not been announced
      event     an in-person event or drawing on a set date
      paused    the organization says it is not currently offering grants
  - The file is plain JSON inside window.FGF_DATA so it stays easy to check:
      node tools/check-data.mjs
*/
window.FGF_DATA = {
  "meta": {
    "site_name": "Fertility Grant Finder",
    "site_url": "https://livingsarahand.github.io/fertility-grant-finder/",
    "research_compiled": "2026-10-18",
    "data_updated": "2026-10-19",
    "display_timezone": "America/Chicago",
    "display_timezone_label": "Central Time",
    "suggestion_form_url": null,
    "credit": {
      "show_name": "The Long Way There",
      "line": "A free resource from The Long Way There podcast.",
      "about": "Made by the hosts of The Long Way There. Independent and not affiliated with any grant program listed.",
      "links": [
        {
          "label": "Spotify",
          "url": "https://open.spotify.com/show/033jG9beFxNf3xFsLHt7aJ"
        },
        {
          "label": "Apple Podcasts",
          "url": "https://podcasts.apple.com/us/podcast/the-long-way-there/id6797527430"
        },
        {
          "label": "YouTube",
          "url": "https://www.youtube.com/@FAITHFERTILITYUS"
        }
      ]
    }
  },
  "organizations": [
    {
      "id": "hope-for-fertility",
      "name": "The Hope for Fertility Foundation",
      "program_name": "Hope for Fertility National Grant",
      "official_url": "https://www.hopeforfertility.org/grant/",
      "application_url": "https://www.hopeforfertility.org/grant/",
      "program_type": "Grant",
      "geography": {
        "type": "us_national",
        "states": [],
        "text": "United States. Applicants must work with a U.S.-based clinic or adoption agency."
      },
      "clinic_required": false,
      "clinic_restrictions": "Any U.S.-based fertility clinic or adoption agency.",
      "treatments_covered": [
        "General fertility treatment",
        "Adoption"
      ],
      "award_min": 250,
      "award_max": 10000,
      "currency": "USD",
      "award_text": "Typically $250 to $10,000, depending on funds raised and the treatment needed.",
      "application_fee": 50,
      "fee_text": "$50 per application, described as a donation that may be tax deductible. Unsuccessful applicants reapply and pay again each cycle.",
      "eligibility_notes": [
        "U.S. citizen or legal permanent resident.",
        "Diagnosed with infertility by a physician.",
        "Legally married.",
        "Working with a U.S.-based clinic or agency.",
        "One grant per couple."
      ],
      "coverage_notes": [
        "Grants are paid to the fertility center or adoption agency, not to the applicant. No reimbursements.",
        "Not applied to medications, third-party fees (such as legal or consulting fees), or third-party financing or insurance."
      ],
      "cycles": [
        {
          "id": "hope-for-fertility-2026-fall",
          "cycle_label": "Fall 2026",
          "cycle_year": 2026,
          "kind": "dated",
          "application_opens_at": {
            "date": "2026-07-01"
          },
          "start_application_deadline_at": null,
          "submission_deadline_at": {
            "date": "2026-09-30",
            "time": "22:00",
            "tz": null,
            "tz_label": "MST (as written on the site banner)",
            "note": "The banner says 10:00 p.m. MST. The page body uses MT for the spring deadline."
          },
          "deadline_basis": "submitted",
          "notification_date": {
            "date": "2026-11-11",
            "note": "Listed as \"Grant Recipients Announced\"."
          },
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "date_confidence": "confirmed",
          "open_verified_on": null,
          "status_note": null,
          "source_url": "https://www.hopeforfertility.org/grant/"
        },
        {
          "id": "hope-for-fertility-2027-spring",
          "cycle_label": "Spring 2027",
          "cycle_year": 2027,
          "kind": "dated",
          "application_opens_at": {
            "date": "2027-01-01"
          },
          "start_application_deadline_at": null,
          "submission_deadline_at": {
            "date": "2027-03-31",
            "time": "22:00",
            "tz": "America/Denver",
            "tz_label": "MT"
          },
          "deadline_basis": "submitted",
          "notification_date": null,
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "date_confidence": "confirmed",
          "open_verified_on": null,
          "status_note": "The official page shows both \"now open\" and \"currently closed\" messages. The dates here come from its Key Dates list.",
          "source_url": "https://www.hopeforfertility.org/grant/"
        }
      ],
      "source_urls": [
        "https://www.hopeforfertility.org/grant/",
        "https://www.hopeforfertility.org/grant-faq/"
      ],
      "last_verified_at": "2026-10-18",
      "verification_status": "verified",
      "research_notes": [
        "Grants are usually awarded twice a year, but the foundation says this may be more or less often depending on funds raised.",
        "A third-party directory lists this grant as \"up to $5,000\". The official page says $250 to $10,000."
      ],
      "requirements": {
        "married": true,
        "us_citizen": false,
        "us_status": true,
        "diagnosis": true,
        "no_children": null,
        "children_max": null,
        "employment": null,
        "health_insurance": null,
        "attend_event": null,
        "age_min": null,
        "age_max": null,
        "income_max": null,
        "other": [
          "One grant per couple."
        ],
        "checked_on": "2026-10-18"
      },
      "links": [
        {
          "label": "Website",
          "url": "https://www.hopeforfertility.org/"
        },
        {
          "label": "Grant details",
          "url": "https://www.hopeforfertility.org/grant/"
        },
        {
          "label": "Grant FAQ",
          "url": "https://www.hopeforfertility.org/grant-faq/"
        }
      ],
      "decision_speed": {
        "text": "About 6 weeks after the deadline (fall 2026: deadline Sept 30, recipients announced Nov 11).",
        "days_max": 42,
        "basis": "after_deadline"
      }
    },
    {
      "id": "baby-quest",
      "name": "Baby Quest Foundation",
      "program_name": "Baby Quest Grant",
      "official_url": "https://babyquestfoundation.org/",
      "application_url": "https://babyquestfoundation.org/applying-for-a-grant-2/",
      "program_type": "Grant",
      "geography": {
        "type": "us_national",
        "states": [],
        "text": "Permanent U.S. residents under the care of an accredited U.S. fertility facility."
      },
      "clinic_required": false,
      "clinic_restrictions": "Any accredited U.S. fertility facility of the applicant's choice.",
      "treatments_covered": [
        "IVF",
        "PGT",
        "Egg freezing",
        "Donor eggs/sperm",
        "Embryo donation/adoption",
        "Surrogacy"
      ],
      "award_min": null,
      "award_max": null,
      "currency": "USD",
      "award_text": null,
      "application_fee": 75,
      "fee_text": "$75, non-refundable, paid through Zeffy. Payment confirmation can take 2 business days.",
      "eligibility_notes": [
        "Permanent U.S. resident.",
        "Needs medical intervention to conceive. Singles and same-sex and heterosexual couples are eligible.",
        "Adequate housing, at least one partner employed, and basic health insurance with prenatal coverage.",
        "Not already receiving help from other charities (clinic discounts and bank loans don't count).",
        "Applicants may apply 2 times in total.",
        "Surrogacy applicants use a separate surrogacy grant program and can't apply for IVF grants."
      ],
      "coverage_notes": [
        "Grants go directly to the clinic, agency, or lab.",
        "Does not reimburse treatment already started, including IVF medications started before the grant decision."
      ],
      "cycles": [
        {
          "id": "baby-quest-2026-fall",
          "cycle_label": "Summer/Fall 2026",
          "cycle_year": 2026,
          "kind": "dated",
          "application_opens_at": {
            "date": "2026-06-08",
            "confidence": "needs_confirmation",
            "note": "The page says June 8 without a year, listed with the 2026 cycle."
          },
          "start_application_deadline_at": {
            "date": "2026-08-28",
            "confidence": "needs_confirmation",
            "note": "The page says August 28 without a year, listed with the 2026 cycle."
          },
          "submission_deadline_at": {
            "date": "2026-09-03",
            "time": "17:00",
            "tz": "America/New_York",
            "tz_label": "ET"
          },
          "deadline_basis": "submitted",
          "notification_date": null,
          "notification_window_text": "By email about 4 to 6 weeks after the deadline.",
          "funds_available_date": null,
          "funds_available_text": "Published general rule: fall grants available November 1.",
          "treatment_start_rule": "Must begin treatment within three months of receiving a grant.",
          "expiration_rule": null,
          "date_confidence": "confirmed",
          "open_verified_on": null,
          "status_note": null,
          "source_url": "https://babyquestfoundation.org/applying-for-a-grant-2/"
        },
        {
          "id": "baby-quest-2027-spring",
          "cycle_label": "Spring 2027",
          "cycle_year": 2027,
          "kind": "dated",
          "application_opens_at": {
            "date": "2027-01-02",
            "confidence": "needs_confirmation",
            "note": "The homepage says \"Next Grant cycle begins January 2nd\" next to the March 4, 2027 deadline. The year is implied, not written."
          },
          "start_application_deadline_at": null,
          "submission_deadline_at": {
            "date": "2027-03-04",
            "time": "17:00",
            "tz": "America/New_York",
            "tz_label": "ET"
          },
          "deadline_basis": "submitted",
          "notification_date": null,
          "notification_window_text": "Published general rule: by email about 4 to 6 weeks after the deadline.",
          "funds_available_date": null,
          "funds_available_text": "Published general rule: spring grants available May 1. Not confirmed for 2027.",
          "treatment_start_rule": "Must begin treatment within three months of receiving a grant.",
          "expiration_rule": null,
          "date_confidence": "confirmed",
          "open_verified_on": null,
          "status_note": "Earlier cycles had a separate deadline to start an application. One has not been announced for spring 2027.",
          "source_url": "https://babyquestfoundation.org/"
        }
      ],
      "source_urls": [
        "https://babyquestfoundation.org/",
        "https://babyquestfoundation.org/applying-for-a-grant-2/",
        "https://babyquestfoundation.org/surrogacy/"
      ],
      "last_verified_at": "2026-10-18",
      "verification_status": "verified",
      "research_notes": [
        "Awards grants twice yearly.",
        "The official pages checked did not state an award range. A third-party directory lists $2,000 to $16,000 in money and medications."
      ],
      "requirements": {
        "married": false,
        "us_citizen": false,
        "us_status": true,
        "diagnosis": null,
        "no_children": null,
        "children_max": null,
        "employment": true,
        "health_insurance": true,
        "attend_event": null,
        "age_min": null,
        "age_max": null,
        "income_max": null,
        "other": [
          "Must need medical help to conceive.",
          "Not already receiving help from other charities.",
          "Adequate housing.",
          "Two applications total."
        ],
        "checked_on": "2026-10-18",
        "welcomes": [
          "single",
          "lgbtq"
        ]
      },
      "links": [
        {
          "label": "Website",
          "url": "https://babyquestfoundation.org/"
        },
        {
          "label": "How to apply and eligibility",
          "url": "https://babyquestfoundation.org/applying-for-a-grant-2/"
        },
        {
          "label": "Surrogacy grants",
          "url": "https://babyquestfoundation.org/surrogacy/"
        }
      ],
      "decision_speed": {
        "text": "About 4 to 6 weeks after the deadline.",
        "days_max": 42,
        "basis": "after_deadline"
      }
    },
    {
      "id": "waiting-for-baby-bird",
      "name": "Waiting for Baby Bird Ministries",
      "program_name": "Family Building GIFTaways and grant events",
      "official_url": "https://waitingforbabybird.com/",
      "application_url": null,
      "program_type": "GIFTaways and event-based grants",
      "geography": {
        "type": "unknown",
        "states": [
          "IL"
        ],
        "text": "Not stated. Events have been held in person in Carmi, Illinois."
      },
      "clinic_required": null,
      "clinic_restrictions": null,
      "treatments_covered": [
        "General fertility treatment",
        "Adoption"
      ],
      "award_min": null,
      "award_max": null,
      "currency": "USD",
      "award_text": "Past examples: a $10,000 Family Building GIFTaway (2024) and $5,000 in grant money given out at a 2025 bingo event.",
      "application_fee": null,
      "fee_text": null,
      "eligibility_notes": [
        "Eligibility for future GIFTaways or events has not been announced.",
        "Joining the ministry's community or social media groups is not described as meeting grant eligibility."
      ],
      "coverage_notes": [],
      "cycles": [
        {
          "id": "waiting-for-baby-bird-2024-giftaway",
          "cycle_label": "2024 $10K Family Building GIFTaway",
          "cycle_year": 2024,
          "kind": "dated",
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": {
            "date": "2024-10-14",
            "confidence": "historical",
            "note": "The October 3, 2024 post says applications are open until October 14."
          },
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": "Recipients announced November 4, 2024.",
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "date_confidence": "historical",
          "open_verified_on": null,
          "status_note": null,
          "source_url": "https://waitingforbabybird.com/category/ministry-updates-events/"
        },
        {
          "id": "waiting-for-baby-bird-2025-bingo",
          "cycle_label": "2025 Hillbilly Bingo Fertility Grant Opportunity",
          "cycle_year": 2025,
          "kind": "event",
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "event_date": {
            "date": "2025-10-18",
            "time": "16:00",
            "tz": "America/Chicago",
            "tz_label": "CST (as written)"
          },
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "date_confidence": "historical",
          "open_verified_on": null,
          "status_note": "An in-person bingo night in Carmi, Illinois that gave away $5,000 in fertility grant money.",
          "source_url": "https://waitingforbabybird.com/events/"
        },
        {
          "id": "waiting-for-baby-bird-next",
          "cycle_label": "Next GIFTaway or grant event",
          "cycle_year": null,
          "kind": "awaiting",
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "date_confidence": "not_announced",
          "open_verified_on": null,
          "status_note": "No 2026 or 2027 GIFTaway or grant event was listed on October 18, 2026. The events page says to check back for signature events.",
          "source_url": "https://waitingforbabybird.com/events/"
        }
      ],
      "source_urls": [
        "https://waitingforbabybird.com/",
        "https://waitingforbabybird.com/category/ministry-updates-events/",
        "https://waitingforbabybird.com/events/"
      ],
      "last_verified_at": "2026-10-18",
      "verification_status": "verified",
      "research_notes": [
        "The GIFTaway program began in 2020, according to the ministry's 2024 announcement."
      ],
      "requirements": {
        "married": null,
        "us_citizen": null,
        "us_status": null,
        "diagnosis": null,
        "no_children": null,
        "children_max": null,
        "employment": null,
        "health_insurance": null,
        "attend_event": null,
        "age_min": null,
        "age_max": null,
        "income_max": null,
        "other": [],
        "checked_on": "2026-10-18"
      },
      "links": [
        {
          "label": "Website",
          "url": "https://waitingforbabybird.com/"
        },
        {
          "label": "Announcements",
          "url": "https://waitingforbabybird.com/category/ministry-updates-events/"
        },
        {
          "label": "Events",
          "url": "https://waitingforbabybird.com/events/"
        }
      ]
    },
    {
      "id": "cade-foundation",
      "name": "Tinina Q. Cade Foundation",
      "program_name": "Family Building Grant",
      "official_url": "https://cadefoundation.org/familygrant",
      "application_url": "https://tininaqcadefoundation.submittable.com/submit",
      "program_type": "Grant",
      "geography": {
        "type": "us_national",
        "states": [],
        "text": "United States. U.S. citizens or legal permanent residents."
      },
      "clinic_required": false,
      "clinic_restrictions": "Any clinic for the main grant. The Savannah Grant and Dr. Stephen Greenhouse Grant are only for Shady Grove Fertility IVF patients (they are entered automatically through the main application).",
      "treatments_covered": [
        "IUI",
        "IVF",
        "Donor eggs/sperm",
        "Surrogacy",
        "Adoption",
        "Medications"
      ],
      "award_min": null,
      "award_max": 10000,
      "currency": "USD",
      "award_text": "Up to $10,000 per family. Medication grants (Gonal-f, Cetrotide, Ovidrel) are provided in kind by EMD Serono.",
      "application_fee": 50,
      "fee_text": "$50, non-refundable. The page says both \"we do not provide discounts or waivers\" and that a limited number of hardship waivers exist. Ask the foundation before relying on a waiver.",
      "eligibility_notes": [
        "Infertility diagnosis from your doctor.",
        "U.S. citizen or legal permanent resident.",
        "Domestic adoption is covered. International adoption is not.",
        "Not eligible if able to conceive but advised by a doctor against pregnancy.",
        "Recipients are expected to attend the Le Diner Bleu gala in person (usually the first Saturday in November in Baltimore) and share a family photo and short video."
      ],
      "coverage_notes": [
        "Egg freezing and embryo freezing are not covered.",
        "Only for services not yet received. Funds must be used for the plan in the original application."
      ],
      "cycles": [
        {
          "id": "cade-foundation-2027-spring",
          "cycle_label": "Spring 2027",
          "cycle_year": 2027,
          "kind": "dated",
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": {
            "date": "2027-02-01",
            "time": "23:00",
            "tz": "America/Chicago",
            "tz_label": "CT",
            "note": "The application portal showed \"Ends on Mon, Feb 1, 2027 11:00 PM\" when viewed in Central Time. The portal may show deadlines in each visitor's local time."
          },
          "deadline_basis": "submitted",
          "notification_date": null,
          "notification_window_text": "Published recurring schedule: spring decisions June 15. Not confirmed for 2027.",
          "funds_available_date": null,
          "funds_available_text": "Published recurring schedule: spring funds disbursed August 1. Not confirmed for 2027.",
          "treatment_start_rule": null,
          "expiration_rule": "Published recurring schedule: spring grants redeemed by July 31 of the following year. Check your award terms.",
          "date_confidence": "confirmed",
          "open_verified_on": "2026-10-18",
          "status_note": "The application portal listed \"Spring 2027 Grant Application\" as accepting submissions on October 18, 2026.",
          "source_url": "https://tininaqcadefoundation.submittable.com/submit"
        },
        {
          "id": "cade-foundation-2027-fall",
          "cycle_label": "Fall 2027",
          "cycle_year": 2027,
          "kind": "awaiting",
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "recurring_text": "Published recurring fall schedule: submission July 1, decisions October 15, funds January 1 of the following year, redeem by December 31. Not confirmed for 2027.",
          "recurring_months": [
            7
          ],
          "date_confidence": "recurring",
          "open_verified_on": null,
          "status_note": null,
          "source_url": "https://cadefoundation.org/familygrant"
        }
      ],
      "source_urls": [
        "https://cadefoundation.org/familygrant",
        "https://tininaqcadefoundation.submittable.com/submit"
      ],
      "last_verified_at": "2026-10-18",
      "verification_status": "verified",
      "research_notes": [],
      "requirements": {
        "married": null,
        "us_citizen": false,
        "us_status": true,
        "diagnosis": true,
        "no_children": null,
        "children_max": null,
        "employment": null,
        "health_insurance": null,
        "attend_event": true,
        "age_min": null,
        "age_max": null,
        "income_max": null,
        "other": [
          "Recipients are expected to attend the foundation's gala in Baltimore and share a family photo and video.",
          "International adoption isn't covered."
        ],
        "checked_on": "2026-10-18"
      },
      "links": [
        {
          "label": "Website",
          "url": "https://cadefoundation.org/"
        },
        {
          "label": "Grant details",
          "url": "https://cadefoundation.org/familygrant"
        },
        {
          "label": "Application portal",
          "url": "https://tininaqcadefoundation.submittable.com/submit"
        }
      ],
      "decision_speed": {
        "text": "About 4 to 5 months after the deadline (spring: deadline Feb 1, decisions June 15).",
        "days_max": 135,
        "basis": "after_deadline"
      }
    },
    {
      "id": "gift-of-parenthood",
      "name": "Gift of Parenthood",
      "program_name": "Gift of Parenthood Grant Program",
      "official_url": "https://giftofparenthood.org/",
      "application_url": "https://grant.giftofparenthood.org/",
      "program_type": "Grant (the organization also runs a separate fundraising platform)",
      "geography": {
        "type": "unknown",
        "states": [],
        "text": "Not stated on the pages checked."
      },
      "clinic_required": false,
      "clinic_restrictions": null,
      "treatments_covered": [
        "IVF",
        "General fertility treatment",
        "Surrogacy",
        "Adoption"
      ],
      "award_min": null,
      "award_max": 20000,
      "currency": "USD",
      "award_text": "Up to $20,000 per award. The $80,000 figure sometimes quoted is the program's annual total, not one award.",
      "application_fee": 75,
      "fee_text": "$75 per cycle, or $250 for a Four-Cycle Pass (four submissions over 12 months). Early bird: pay $75 as three $25 payments until October 31, 2026. The fee is waived automatically if you raise $250 or more from at least two supporters on a Gift of Parenthood fundraiser.",
      "eligibility_notes": [
        "Age 18 or older, with documentation of your infertility journey and demonstrated financial need.",
        "Good physical and mental health. At least one partner (or the individual applicant) employed.",
        "Health insurance is not required.",
        "Grants generally aren't given to people already receiving significant help from other charities."
      ],
      "coverage_notes": [
        "Can't be used for treatment that began before the award notification."
      ],
      "cycles": [
        {
          "id": "gift-of-parenthood-2026-q3",
          "cycle_label": "Q3 2026",
          "cycle_year": 2026,
          "kind": "dated",
          "application_opens_at": {
            "date": "2026-06-30",
            "alternatives": [
              {
                "date": "2026-07-01",
                "source": "Grant FAQ (Q3 runs July 1 to September 30)"
              }
            ]
          },
          "start_application_deadline_at": null,
          "submission_deadline_at": {
            "date": "2026-09-29",
            "alternatives": [
              {
                "date": "2026-09-30",
                "source": "Grant FAQ"
              }
            ]
          },
          "deadline_basis": "submitted",
          "notification_date": {
            "date": "2026-10-14",
            "alternatives": [
              {
                "date": "2026-10-15",
                "source": "Grant FAQ (results by October 15)"
              }
            ]
          },
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": "Recipients are expected to begin treatment within three months of the award.",
          "expiration_rule": null,
          "date_confidence": "needs_confirmation",
          "open_verified_on": null,
          "status_note": "The timeline page and the FAQ give dates one day apart.",
          "source_url": "https://grant.giftofparenthood.org/timeline"
        },
        {
          "id": "gift-of-parenthood-2026-q4",
          "cycle_label": "Q4 2026",
          "cycle_year": 2026,
          "kind": "dated",
          "application_opens_at": {
            "date": "2026-09-30",
            "alternatives": [
              {
                "date": "2026-10-01",
                "source": "Grant FAQ (Q4 runs October 1 to December 31)"
              }
            ]
          },
          "start_application_deadline_at": null,
          "submission_deadline_at": {
            "date": "2026-12-30",
            "alternatives": [
              {
                "date": "2026-12-31",
                "time": "23:59",
                "tz": "America/Los_Angeles",
                "tz_label": "PT",
                "source": "Grant FAQ and the grant portal in earlier research"
              }
            ]
          },
          "deadline_basis": "submitted",
          "notification_date": {
            "date": "2027-01-14",
            "alternatives": [
              {
                "date": "2027-01-15",
                "source": "Grant FAQ (results by January 15)"
              }
            ]
          },
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": "Recipients are expected to begin treatment within three months of the award.",
          "expiration_rule": null,
          "date_confidence": "needs_confirmation",
          "open_verified_on": "2026-10-18",
          "status_note": "The official timeline marked Q4 2026 \"Open now\" on October 18, 2026. The timeline and the FAQ give dates one day apart.",
          "source_url": "https://grant.giftofparenthood.org/timeline"
        },
        {
          "id": "gift-of-parenthood-2027-q1",
          "cycle_label": "Q1 2027",
          "cycle_year": 2027,
          "kind": "dated",
          "application_opens_at": {
            "date": "2026-12-31",
            "alternatives": [
              {
                "date": "2027-01-01",
                "source": "Grant FAQ (Q1 runs January 1 to March 31)"
              }
            ]
          },
          "start_application_deadline_at": null,
          "submission_deadline_at": {
            "date": "2027-03-30",
            "alternatives": [
              {
                "date": "2027-03-31",
                "source": "Grant FAQ"
              }
            ]
          },
          "deadline_basis": "submitted",
          "notification_date": {
            "date": "2027-04-14",
            "alternatives": [
              {
                "date": "2027-04-15",
                "source": "Grant FAQ (results by April 15)"
              }
            ]
          },
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": "Recipients are expected to begin treatment within three months of the award.",
          "expiration_rule": null,
          "date_confidence": "needs_confirmation",
          "open_verified_on": null,
          "status_note": "Listed as \"Opening soon\" on the official timeline. The timeline and the FAQ give dates one day apart.",
          "source_url": "https://grant.giftofparenthood.org/timeline"
        },
        {
          "id": "gift-of-parenthood-2027-q2",
          "cycle_label": "Q2 2027",
          "cycle_year": 2027,
          "kind": "dated",
          "application_opens_at": {
            "date": "2027-03-31",
            "alternatives": [
              {
                "date": "2027-04-01",
                "source": "Grant FAQ (Q2 runs April 1 to June 30)"
              }
            ]
          },
          "start_application_deadline_at": null,
          "submission_deadline_at": {
            "date": "2027-06-29",
            "alternatives": [
              {
                "date": "2027-06-30",
                "source": "Grant FAQ"
              }
            ]
          },
          "deadline_basis": "submitted",
          "notification_date": {
            "date": "2027-07-14",
            "alternatives": [
              {
                "date": "2027-07-15",
                "source": "Grant FAQ (results by July 15)"
              }
            ]
          },
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": "Recipients are expected to begin treatment within three months of the award.",
          "expiration_rule": null,
          "date_confidence": "needs_confirmation",
          "open_verified_on": null,
          "status_note": "Listed as \"Opening soon\" on the official timeline. The timeline and the FAQ give dates one day apart.",
          "source_url": "https://grant.giftofparenthood.org/timeline"
        },
        {
          "id": "gift-of-parenthood-2027-q3",
          "cycle_label": "Q3 2027",
          "cycle_year": 2027,
          "kind": "dated",
          "application_opens_at": {
            "date": "2027-06-30",
            "alternatives": [
              {
                "date": "2027-07-01",
                "source": "Grant FAQ (Q3 runs July 1 to September 30)"
              }
            ]
          },
          "start_application_deadline_at": null,
          "submission_deadline_at": {
            "date": "2027-09-29",
            "alternatives": [
              {
                "date": "2027-09-30",
                "source": "Grant FAQ"
              }
            ]
          },
          "deadline_basis": "submitted",
          "notification_date": {
            "date": "2027-10-14",
            "alternatives": [
              {
                "date": "2027-10-15",
                "source": "Grant FAQ (results by October 15)"
              }
            ]
          },
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": "Recipients are expected to begin treatment within three months of the award.",
          "expiration_rule": null,
          "date_confidence": "needs_confirmation",
          "open_verified_on": null,
          "status_note": "Listed as \"Opening soon\" on the official timeline. The timeline and the FAQ give dates one day apart.",
          "source_url": "https://grant.giftofparenthood.org/timeline"
        },
        {
          "id": "gift-of-parenthood-2027-q4",
          "cycle_label": "Q4 2027",
          "cycle_year": 2027,
          "kind": "dated",
          "application_opens_at": {
            "date": "2027-09-30",
            "alternatives": [
              {
                "date": "2027-10-01",
                "source": "Grant FAQ (Q4 runs October 1 to December 31)"
              }
            ]
          },
          "start_application_deadline_at": null,
          "submission_deadline_at": {
            "date": "2027-12-30",
            "alternatives": [
              {
                "date": "2027-12-31",
                "source": "Grant FAQ"
              }
            ]
          },
          "deadline_basis": "submitted",
          "notification_date": {
            "date": "2028-01-14",
            "alternatives": [
              {
                "date": "2028-01-15",
                "source": "Grant FAQ (results by January 15)"
              }
            ]
          },
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": "Recipients are expected to begin treatment within three months of the award.",
          "expiration_rule": null,
          "date_confidence": "needs_confirmation",
          "open_verified_on": null,
          "status_note": "Listed as \"Opening soon\" on the official timeline. The timeline and the FAQ give dates one day apart.",
          "source_url": "https://grant.giftofparenthood.org/timeline"
        }
      ],
      "source_urls": [
        "https://grant.giftofparenthood.org/timeline",
        "https://grant.giftofparenthood.org/faqs",
        "https://giftofparenthood.org/"
      ],
      "last_verified_at": "2026-10-18",
      "verification_status": "verified",
      "research_notes": [
        "The FAQ also says recipients are announced \"on or around the 1st of every quarter\", which conflicts with its own results-by dates. It directs applicants to their account dashboard for the official date.",
        "The timeline page appears to show each date one day earlier than the FAQ. This may be a display issue on their site, but it has not been confirmed."
      ],
      "requirements": {
        "married": null,
        "us_citizen": null,
        "us_status": null,
        "diagnosis": null,
        "no_children": null,
        "children_max": null,
        "employment": true,
        "health_insurance": false,
        "attend_event": null,
        "age_min": 18,
        "age_max": null,
        "income_max": null,
        "other": [
          "Documentation of your infertility journey and financial need.",
          "Generally not for people already receiving significant help from other charities."
        ],
        "checked_on": "2026-10-18"
      },
      "links": [
        {
          "label": "Website",
          "url": "https://giftofparenthood.org/"
        },
        {
          "label": "Grant program",
          "url": "https://grant.giftofparenthood.org/"
        },
        {
          "label": "Grant timeline",
          "url": "https://grant.giftofparenthood.org/timeline"
        },
        {
          "label": "Grant FAQ",
          "url": "https://grant.giftofparenthood.org/faqs"
        }
      ],
      "decision_speed": {
        "text": "About 2 weeks after each quarterly deadline.",
        "days_max": 16,
        "basis": "after_deadline"
      }
    },
    {
      "id": "bundle-of-joy",
      "name": "Samantha and Kyle Busch Bundle of Joy Fund",
      "program_name": "Bundle of Joy Fund Grant",
      "official_url": "https://bundleofjoyfund.org/",
      "application_url": "https://bundleofjoyfund.org/grants/",
      "program_type": "Grant",
      "geography": {
        "type": "us_regional",
        "states": [
          "NC",
          "SC"
        ],
        "text": "Apply through a partnering clinic: REACH Fertility, Piedmont Reproductive Endocrinology Group (PREG), or Carolina Conceptions."
      },
      "clinic_required": true,
      "clinic_restrictions": "Must have an infertility diagnosis from a partnering clinic: REACH Fertility, Piedmont Reproductive Endocrinology Group (PREG), or Carolina Conceptions.",
      "treatments_covered": [
        "IVF"
      ],
      "award_min": null,
      "award_max": 20000,
      "currency": "USD",
      "award_text": "Up to $20,000 per household.",
      "application_fee": 35,
      "fee_text": "$35, non-refundable, paid to the partnering clinic when you submit.",
      "eligibility_notes": [
        "Legal permanent U.S. citizens, age 18 or older.",
        "Infertility diagnosis from a partnering clinic.",
        "Applicants not awarded may reapply if seen at a partnering clinic within 6 months of applying.",
        "Past grant recipients can't reapply."
      ],
      "coverage_notes": [],
      "cycles": [
        {
          "id": "bundle-of-joy-2026-cycle-1",
          "cycle_label": "2026 Cycle I (spring)",
          "cycle_year": 2026,
          "kind": "dated",
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": {
            "date": "2026-03-02"
          },
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": "Review within 6 to 8 weeks after the deadline. Reveals within 60 days of the deadline.",
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "date_confidence": "confirmed",
          "open_verified_on": null,
          "status_note": null,
          "source_url": "https://bundleofjoyfund.org/grants/"
        },
        {
          "id": "bundle-of-joy-2026-cycle-2",
          "cycle_label": "2026 Cycle II (summer)",
          "cycle_year": 2026,
          "kind": "dated",
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": {
            "date": "2026-06-29"
          },
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": "Review within 6 to 8 weeks after the deadline. Reveals within 60 days of the deadline.",
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "date_confidence": "confirmed",
          "open_verified_on": null,
          "status_note": null,
          "source_url": "https://bundleofjoyfund.org/grants/"
        },
        {
          "id": "bundle-of-joy-2026-cycle-3",
          "cycle_label": "2026 winter cycle",
          "cycle_year": 2026,
          "kind": "awaiting",
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "date_confidence": "not_announced",
          "open_verified_on": null,
          "status_note": "The grant page says there are three cycles a year (spring, summer, and winter) but listed no winter date on October 18, 2026.",
          "source_url": "https://bundleofjoyfund.org/grants/"
        },
        {
          "id": "bundle-of-joy-2027",
          "cycle_label": "2027 cycles",
          "cycle_year": 2027,
          "kind": "awaiting",
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "date_confidence": "not_announced",
          "open_verified_on": null,
          "status_note": "No 2027 deadlines were posted on October 18, 2026.",
          "source_url": "https://bundleofjoyfund.org/grants/"
        }
      ],
      "source_urls": [
        "https://bundleofjoyfund.org/grants/",
        "https://bundleofjoyfund.org/"
      ],
      "last_verified_at": "2026-10-18",
      "verification_status": "verified",
      "research_notes": [
        "The grant page doesn't list specific covered treatments. Earlier research described the focus as IVF.",
        "A third-party directory describes eligibility as North or South Carolina residents. The official page lists the partnering-clinic requirement instead."
      ],
      "requirements": {
        "married": null,
        "us_citizen": null,
        "us_status": true,
        "diagnosis": true,
        "no_children": null,
        "children_max": null,
        "employment": null,
        "health_insurance": null,
        "attend_event": null,
        "age_min": 18,
        "age_max": null,
        "income_max": null,
        "other": [
          "The page says \"legal permanent U.S. Citizens\"; check with the fund whether permanent residents qualify.",
          "Diagnosis must come from a partnering clinic."
        ],
        "checked_on": "2026-10-18"
      },
      "links": [
        {
          "label": "Website",
          "url": "https://bundleofjoyfund.org/"
        },
        {
          "label": "Grant details",
          "url": "https://bundleofjoyfund.org/grants/"
        }
      ],
      "decision_speed": {
        "text": "Within 60 days of the deadline.",
        "days_max": 60,
        "basis": "after_deadline"
      }
    },
    {
      "id": "footsteps-for-fertility",
      "name": "Footsteps for Fertility Foundation",
      "program_name": "Grant-giving events and National Application",
      "official_url": "https://footstepsforfertility.org/",
      "application_url": "https://footstepsforfertility.org/grants/",
      "program_type": "Event-based random-selection grants",
      "geography": {
        "type": "us_regional",
        "states": [
          "UT",
          "ID"
        ],
        "text": "Most grants are tied to in-person events (2026 events were in Utah and Idaho). A National Application is offered from time to time."
      },
      "clinic_required": true,
      "clinic_restrictions": "Donated treatment comes through SART-recognized partner clinics.",
      "treatments_covered": [
        "IVF",
        "FET",
        "IUI"
      ],
      "award_min": null,
      "award_max": null,
      "currency": "USD",
      "award_text": "Donated basic IVF cycles through partner clinics, or monetary grants typically $5,000 when funding permits.",
      "application_fee": 30,
      "fee_text": "$30 grant application fee plus a $35 event registration. The National Application costs $100 per applicant couple.",
      "eligibility_notes": [
        "Meet SART's definition of infertility.",
        "Complete the online grant application with your event registration.",
        "Register for and attend a local event if selected."
      ],
      "coverage_notes": [
        "Donated IVF cycles do not cover medications, blood work, anesthesia, donor sperm, donor eggs, or adopted embryos."
      ],
      "cycles": [
        {
          "id": "footsteps-2026-salt-lake-city",
          "cycle_label": "2026 Salt Lake City event",
          "cycle_year": 2026,
          "kind": "event",
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "event_date": {
            "date": "2026-09-12",
            "time": "10:00",
            "tz": "America/Denver",
            "tz_label": "MT"
          },
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": "Grants are awarded by random selection right after the event.",
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "date_confidence": "confirmed",
          "open_verified_on": null,
          "status_note": "Hidden Valley Park, Sandy, Utah.",
          "source_url": "https://footstepsforfertility.org/services/"
        },
        {
          "id": "footsteps-2026-saint-george",
          "cycle_label": "Saint George, Utah event",
          "cycle_year": null,
          "kind": "awaiting",
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": "Grants are awarded by random selection right after the event.",
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "date_confidence": "not_announced",
          "open_verified_on": null,
          "status_note": "Listed as \"Coming Soon\" with the date TBD on October 18, 2026.",
          "source_url": "https://footstepsforfertility.org/services/"
        },
        {
          "id": "footsteps-2026-idaho-falls",
          "cycle_label": "Idaho Falls, Idaho event",
          "cycle_year": null,
          "kind": "awaiting",
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": "Grants are awarded by random selection right after the event.",
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "date_confidence": "not_announced",
          "open_verified_on": null,
          "status_note": "Listed as \"Coming Soon\" with the date TBD on October 18, 2026.",
          "source_url": "https://footstepsforfertility.org/services/"
        },
        {
          "id": "footsteps-national-application",
          "cycle_label": "National Application",
          "cycle_year": null,
          "kind": "awaiting",
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": "Decided by random selection.",
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "date_confidence": "not_announced",
          "open_verified_on": null,
          "status_note": "Offered periodically for people who can't attend an event. No window was listed on October 18, 2026.",
          "source_url": "https://footstepsforfertility.org/grants/",
          "requirements_override": {
            "attend_event": false
          }
        }
      ],
      "source_urls": [
        "https://footstepsforfertility.org/",
        "https://footstepsforfertility.org/grants/",
        "https://footstepsforfertility.org/services/"
      ],
      "last_verified_at": "2026-10-18",
      "verification_status": "verified",
      "research_notes": [
        "Different organization from Footprints of Angels."
      ],
      "requirements": {
        "married": null,
        "us_citizen": null,
        "us_status": null,
        "diagnosis": true,
        "no_children": null,
        "children_max": null,
        "employment": null,
        "health_insurance": null,
        "attend_event": true,
        "age_min": null,
        "age_max": null,
        "income_max": null,
        "other": [
          "Event grants require attending the event if selected. The National Application is for people who can't attend."
        ],
        "checked_on": "2026-10-18"
      },
      "links": [
        {
          "label": "Website",
          "url": "https://footstepsforfertility.org/"
        },
        {
          "label": "Grants and fees",
          "url": "https://footstepsforfertility.org/grants/"
        },
        {
          "label": "Events",
          "url": "https://footstepsforfertility.org/services/"
        }
      ],
      "decision_speed": {
        "text": "Random selection right after each event.",
        "days_max": 0,
        "basis": "after_deadline"
      }
    },
    {
      "id": "parental-hope",
      "name": "Parental Hope",
      "program_name": "Parental Hope Family Grant",
      "official_url": "https://parentalhope.org/parental-hope-family-grant-2/",
      "application_url": "https://parentalhope.org/parental-hope-family-grant-2/grant-process/",
      "program_type": "Grant (donated IVF or FET cycle) and Embryo Adoption & Donation Grant",
      "geography": {
        "type": "us_regional",
        "states": [
          "OH",
          "TN"
        ],
        "text": "U.S. citizens. IVF and FET grants are used at the Institute for Reproductive Health in Cincinnati, Ohio. The embryo adoption grant is through the National Embryo Donation Center in Knoxville, Tennessee."
      },
      "clinic_required": true,
      "clinic_restrictions": "IVF and FET: Institute for Reproductive Health, Cincinnati, Ohio. Embryo adoption: National Embryo Donation Center, Knoxville, Tennessee.",
      "treatments_covered": [
        "IVF",
        "FET",
        "Embryo donation/adoption"
      ],
      "award_min": null,
      "award_max": 5000,
      "currency": "USD",
      "award_text": "IVF grant: the cost of a standard IVF cycle (one retrieval, one transfer, ICSI if medically necessary, and the education day fee). FET grant: one frozen embryo transfer. Embryo adoption grant: one-time payment up to $5,000.",
      "application_fee": 50,
      "fee_text": "$50, non-refundable (listed for the fall 2026 cycle; not yet verified for 2027).",
      "eligibility_notes": [
        "Any U.S. citizen with an infertility diagnosis can apply. You don't need to be an existing patient.",
        "Egg or sperm donor cases may apply.",
        "The application asks for proof of income, a letter from your insurer, a medical evaluation form, and a video essay."
      ],
      "coverage_notes": [
        "Medication is not included.",
        "Egg or sperm donor fees are not covered.",
        "Can't reimburse cycles already performed. No funds are paid to recipients."
      ],
      "cycles": [
        {
          "id": "parental-hope-2026-fall",
          "cycle_label": "Fall 2026",
          "cycle_year": 2026,
          "kind": "dated",
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": {
            "month": "2026-09",
            "time": "23:30",
            "tz": null,
            "tz_label": null,
            "confidence": "needs_confirmation",
            "note": "The official page says \"11:30 p.m. on September, 2026\". The day is missing."
          },
          "deadline_basis": "submitted",
          "notification_date": {
            "date": "2026-11-15",
            "note": "Chosen applicants notified by this date. Others are notified after chosen applicants accept."
          },
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "date_confidence": "confirmed",
          "open_verified_on": null,
          "status_note": "The official page says the fall grant cycle is closed.",
          "source_url": "https://parentalhope.org/parental-hope-family-grant-2/grant-process/"
        },
        {
          "id": "parental-hope-2027-spring",
          "cycle_label": "Spring 2027",
          "cycle_year": 2027,
          "kind": "dated",
          "application_opens_at": {
            "month": "2027-03",
            "note": "\"Spring Grant applications will open in March 2027.\" Day not announced."
          },
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": "FAQ: grants are awarded about 6 to 8 weeks after the application deadline.",
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "date_confidence": "month_only",
          "open_verified_on": null,
          "status_note": null,
          "source_url": "https://parentalhope.org/parental-hope-family-grant-2/"
        }
      ],
      "source_urls": [
        "https://parentalhope.org/parental-hope-family-grant-2/",
        "https://parentalhope.org/parental-hope-family-grant-2/grant-process/",
        "https://parentalhope.org/parental-hope-family-grant-2/faqs/"
      ],
      "last_verified_at": "2026-10-18",
      "verification_status": "verified",
      "research_notes": [
        "Separate IVF/FET and embryo adoption terms and conditions documents are linked from the grant process page. Check them for treatment start and expiration rules."
      ],
      "requirements": {
        "married": null,
        "us_citizen": true,
        "us_status": true,
        "diagnosis": true,
        "no_children": null,
        "children_max": null,
        "employment": null,
        "health_insurance": null,
        "attend_event": null,
        "age_min": null,
        "age_max": null,
        "income_max": null,
        "other": [
          "The application asks for proof of income and a letter from your insurer."
        ],
        "checked_on": "2026-10-18"
      },
      "links": [
        {
          "label": "Website",
          "url": "https://parentalhope.org/"
        },
        {
          "label": "Grant details",
          "url": "https://parentalhope.org/parental-hope-family-grant-2/"
        },
        {
          "label": "Grant process",
          "url": "https://parentalhope.org/parental-hope-family-grant-2/grant-process/"
        },
        {
          "label": "Grant FAQ",
          "url": "https://parentalhope.org/parental-hope-family-grant-2/faqs/"
        }
      ],
      "decision_speed": {
        "text": "About 6 to 8 weeks after the deadline.",
        "days_max": 56,
        "basis": "after_deadline"
      }
    },
    {
      "id": "chicago-coalition",
      "name": "Chicago Coalition for Family Building",
      "program_name": "Family Building Grants, IVF Cycle Grants, and named grants",
      "official_url": "https://coalitionforfamilybuilding.org/grants/",
      "application_url": "https://coalitionforfamilybuilding.org/interest-form/",
      "program_type": "Financial assistance, donated IVF cycles, and named grants",
      "geography": {
        "type": "us_regional",
        "states": [
          "IL",
          "WI",
          "IN"
        ],
        "text": "Most grants require Illinois providers. IVF Cycle Grant applicants may live in Illinois, Wisconsin, or Indiana but are treated at an Illinois partner practice. JUF grants require residence in Cook, Lake, DuPage, Will, McHenry, or Kane County. Willow Grant applicants may live and be treated in IL, IN, or WI."
      },
      "clinic_required": true,
      "clinic_restrictions": "Financial grants are limited to SART member clinics, mostly in Illinois. Donated IVF cycles are at Illinois partner practices.",
      "treatments_covered": [
        "IVF",
        "IUI",
        "Medications",
        "Donor eggs/sperm",
        "Surrogacy",
        "Adoption",
        "PGT",
        "Egg freezing"
      ],
      "award_min": null,
      "award_max": 10000,
      "currency": "USD",
      "award_text": "Financial assistance up to $10,000. IVF Cycle Grants are donated cycles. Magnolia Tree: up to $5,000 for PGT-M or egg freezing (one section of the page says up to $10,000 for BRCA-related cases).",
      "application_fee": null,
      "fee_text": "The page says application fees are non-refundable but doesn't list the amount.",
      "eligibility_notes": [
        "0 or 1 healthy living children.",
        "For IUI, IVF, or gestational carrier with your own eggs: 41 or younger by January 1 of the following year, BMI under 40, FSH under 15, AMH above 0.8.",
        "Medical testing completed within 12 months.",
        "Apply for only one grant type."
      ],
      "coverage_notes": [
        "Paid directly to the provider, only for future costs.",
        "Elective egg or embryo freezing is not eligible."
      ],
      "cycles": [
        {
          "id": "chicago-coalition-2026-late-fall",
          "cycle_label": "Late fall 2026 (November–December)",
          "cycle_year": 2026,
          "kind": "dated",
          "application_opens_at": {
            "month": "2026-11",
            "note": "\"The next application cycle will begin in November 2026.\" Day not announced."
          },
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": "Grant use must begin within 6 months of receiving the grant.",
          "expiration_rule": "Expires 12 months after issuance.",
          "date_confidence": "month_only",
          "open_verified_on": null,
          "status_note": "Which grant types are included in this cycle has not been announced.",
          "source_url": "https://coalitionforfamilybuilding.org/grants/"
        },
        {
          "id": "chicago-coalition-magnolia-tree",
          "cycle_label": "Magnolia Tree Grant (year-round)",
          "cycle_year": null,
          "kind": "rolling",
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": "Reviewed on an ongoing basis.",
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": "Grant use must begin within 6 months of receiving the grant.",
          "expiration_rule": "Expires 12 months after issuance.",
          "date_confidence": "confirmed",
          "open_verified_on": "2026-10-18",
          "status_note": "For PGT-M or egg freezing. Applicants must live in and be treated in Illinois. Can't be used retroactively.",
          "source_url": "https://coalitionforfamilybuilding.org/grants/"
        },
        {
          "id": "chicago-coalition-2027-spring",
          "cycle_label": "Spring 2027 (April)",
          "cycle_year": 2027,
          "kind": "awaiting",
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "recurring_text": "The main cycle opens each April during National Infertility Awareness Week. IVF Cycle Grants and JUF Path to Parenthood also open in April. Not confirmed for 2027.",
          "recurring_months": [
            4
          ],
          "date_confidence": "recurring",
          "open_verified_on": null,
          "status_note": null,
          "source_url": "https://coalitionforfamilybuilding.org/grants/"
        }
      ],
      "source_urls": [
        "https://coalitionforfamilybuilding.org/grants/",
        "https://coalitionforfamilybuilding.org/interest-form/"
      ],
      "last_verified_at": "2026-10-18",
      "verification_status": "verified",
      "research_notes": [
        "JUF Path to Parenthood is offered in April and December. It was marked closed on October 18, 2026.",
        "Named 2026 grants include the Jen \"Bibbs\" Bibbiano Memorial Grant, the Lillian C. Millman Grant, and the Willow Grant (closed).",
        "The Kevin J. Lederer Memorial Grant is a donated IVF cycle for an existing Fertility Centers of Illinois patient."
      ],
      "requirements": {
        "married": null,
        "us_citizen": null,
        "us_status": null,
        "diagnosis": null,
        "no_children": null,
        "children_max": 1,
        "employment": null,
        "health_insurance": null,
        "attend_event": null,
        "age_min": null,
        "age_max": null,
        "income_max": null,
        "other": [
          "For IUI, IVF, or a gestational carrier with your own eggs: 41 or younger by January 1 of the following year, plus BMI and hormone limits.",
          "Illinois treatment providers (some grants also allow Wisconsin or Indiana residents)."
        ],
        "checked_on": "2026-10-18"
      },
      "links": [
        {
          "label": "Website",
          "url": "https://coalitionforfamilybuilding.org/"
        },
        {
          "label": "Grants",
          "url": "https://coalitionforfamilybuilding.org/grants/"
        },
        {
          "label": "Grant interest form",
          "url": "https://coalitionforfamilybuilding.org/interest-form/"
        }
      ]
    },
    {
      "id": "nest-egg",
      "name": "Nest Egg Foundation",
      "program_name": "Nest Egg Foundation IVF Grant",
      "official_url": "https://www.nesteggfoundation.org/",
      "application_url": "https://www.nesteggfoundation.org/apply/",
      "program_type": "Grant",
      "geography": {
        "type": "us_regional",
        "states": [
          "CT",
          "NY"
        ],
        "text": "Connecticut or New York residents, treated at a participating Connecticut center."
      },
      "clinic_required": true,
      "clinic_restrictions": "Center for Advanced Reproductive Services (CARS) or Illume Fertility.",
      "treatments_covered": [
        "IVF",
        "Donor eggs/sperm",
        "Surrogacy"
      ],
      "award_min": 5000,
      "award_max": 20000,
      "currency": "USD",
      "award_text": "$5,000 to $20,000 depending on funding and treatment. (One section says \"no more than $20,000\".)",
      "application_fee": 50,
      "fee_text": "$50, non-refundable. Reapplicants pay again.",
      "eligibility_notes": [
        "Needs confirmation: one section requires U.S. citizenship for at least four years; the FAQ says permanent legal residents.",
        "Age 25 to 44.",
        "Income under $125,000 (single) or $200,000 (partnered).",
        "Primary infertility (no children). Seen by a reproductive endocrinologist in the previous 6 to 9 months.",
        "Clinical criteria apply (AMH, FSH, BMI, and others). See the official page."
      ],
      "coverage_notes": [
        "Grants must be used within six months."
      ],
      "cycles": [
        {
          "id": "nest-egg-2026",
          "cycle_label": "2026 application",
          "cycle_year": 2026,
          "kind": "dated",
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": "Review may take up to 12 weeks.",
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": "Must be used within six months.",
          "date_confidence": "historical",
          "closed_verified_on": "2026-10-18",
          "open_verified_on": null,
          "status_note": "The homepage said \"2026 Application is now closed\" on October 18, 2026. Exact 2026 dates were not listed.",
          "source_url": "https://www.nesteggfoundation.org/"
        },
        {
          "id": "nest-egg-2027",
          "cycle_label": "2027 application",
          "cycle_year": 2027,
          "kind": "awaiting",
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "date_confidence": "not_announced",
          "open_verified_on": null,
          "status_note": "The foundation suggests following it on Instagram or Facebook for the next window.",
          "source_url": "https://www.nesteggfoundation.org/"
        }
      ],
      "source_urls": [
        "https://www.nesteggfoundation.org/",
        "https://www.nesteggfoundation.org/apply/"
      ],
      "last_verified_at": "2026-10-18",
      "verification_status": "verified",
      "research_notes": [
        "Coverage wording varies across the page: one section lists IVF only, another adds egg or embryo donation and surrogacy."
      ],
      "requirements": {
        "married": null,
        "us_citizen": null,
        "us_status": true,
        "diagnosis": "some",
        "no_children": true,
        "children_max": null,
        "employment": null,
        "health_insurance": null,
        "attend_event": null,
        "age_min": 25,
        "age_max": 44,
        "income_max": 200000,
        "other": [
          "Citizenship wording differs on the page (U.S. citizens for 4+ years vs. permanent legal residents). Confirm with the foundation.",
          "Income limit: under $125,000 single, $200,000 partnered.",
          "Diagnosis not required for single applicants and same-sex couples.",
          "Clinical criteria apply (AMH, FSH, BMI, non-smoking)."
        ],
        "checked_on": "2026-10-18",
        "welcomes": [
          "single",
          "lgbtq"
        ]
      },
      "links": [
        {
          "label": "Website",
          "url": "https://www.nesteggfoundation.org/"
        },
        {
          "label": "Eligibility and how to apply",
          "url": "https://www.nesteggfoundation.org/apply/"
        }
      ],
      "decision_speed": {
        "text": "Review can take up to 12 weeks.",
        "days_max": 84,
        "basis": "after_deadline"
      }
    },
    {
      "id": "everlasting-hope",
      "name": "Everlasting Hope",
      "program_name": "Everlasting Hope Grant Program",
      "official_url": "https://www.raisingeverlastinghope.org/grant-program",
      "application_url": "https://www.raisingeverlastinghope.org/grant-program",
      "program_type": "Grant",
      "geography": {
        "type": "unknown",
        "states": [
          "ND"
        ],
        "text": "Described as support for local couples. The organization is based in North Dakota. Check the application for the exact service area."
      },
      "clinic_required": null,
      "clinic_restrictions": null,
      "treatments_covered": [
        "General fertility treatment"
      ],
      "award_min": null,
      "award_max": null,
      "currency": "USD",
      "award_text": null,
      "application_fee": null,
      "fee_text": null,
      "eligibility_notes": [
        "Full qualifications are in the application."
      ],
      "coverage_notes": [],
      "cycles": [
        {
          "id": "everlasting-hope-rolling",
          "cycle_label": "Rolling applications",
          "cycle_year": null,
          "kind": "rolling",
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": "The team contacts applicants directly after review. No turnaround time is published.",
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "date_confidence": "confirmed",
          "open_verified_on": "2026-10-18",
          "status_note": "\"Grants are offered on a rolling basis and are awarded quarterly, based on available funding.\"",
          "source_url": "https://www.raisingeverlastinghope.org/grant-program"
        }
      ],
      "source_urls": [
        "https://www.raisingeverlastinghope.org/grant-program"
      ],
      "last_verified_at": "2026-10-18",
      "verification_status": "partially_verified",
      "research_notes": [
        "The page footer reads © 2019, so some details may be out of date."
      ],
      "requirements": {
        "married": null,
        "us_citizen": null,
        "us_status": null,
        "diagnosis": null,
        "no_children": null,
        "children_max": null,
        "employment": null,
        "health_insurance": null,
        "attend_event": null,
        "age_min": null,
        "age_max": null,
        "income_max": null,
        "other": [
          "Full qualifications are in the application."
        ],
        "checked_on": "2026-10-18"
      },
      "links": [
        {
          "label": "Website",
          "url": "https://www.raisingeverlastinghope.org/"
        },
        {
          "label": "Grant program",
          "url": "https://www.raisingeverlastinghope.org/grant-program"
        }
      ]
    },
    {
      "id": "journey-to-parenthood",
      "name": "Journey to Parenthood",
      "program_name": "Journey to Parenthood Grant",
      "official_url": "https://journeytoparenthood.org/",
      "application_url": "https://journeytoparenthood.org/application-html/",
      "program_type": "Grant",
      "geography": {
        "type": "unknown",
        "states": [],
        "text": "Not stated on the application page. Check the FAQ."
      },
      "clinic_required": null,
      "clinic_restrictions": null,
      "treatments_covered": [
        "General fertility treatment"
      ],
      "award_min": 2000,
      "award_max": 10000,
      "currency": "USD",
      "award_text": "Typically $2,000 to $10,000. Usually 1 to 4 grants a year from 75 to 100 applications.",
      "application_fee": null,
      "fee_text": null,
      "eligibility_notes": [
        "See the FAQ page on the official site."
      ],
      "coverage_notes": [],
      "cycles": [
        {
          "id": "journey-to-parenthood-2026",
          "cycle_label": "2026 annual cycle",
          "cycle_year": 2026,
          "kind": "dated",
          "application_opens_at": {
            "date": "2026-08-01"
          },
          "start_application_deadline_at": null,
          "submission_deadline_at": {
            "date": "2026-10-17",
            "note": "Must be postmarked by this date. Applications are not accepted by email."
          },
          "deadline_basis": "postmark",
          "notification_date": {
            "date": "2026-12-31",
            "note": "Outcome notification by this date. Receipt acknowledgement by November 1, 2026."
          },
          "notification_window_text": "Applicants told by November 1, 2026 that their application was received.",
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "date_confidence": "confirmed",
          "open_verified_on": null,
          "status_note": null,
          "source_url": "https://journeytoparenthooddotorg.wpcomstaging.com/application-html/"
        },
        {
          "id": "journey-to-parenthood-2027",
          "cycle_label": "2027 annual cycle",
          "cycle_year": 2027,
          "kind": "awaiting",
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "deadline_basis": "postmark",
          "notification_date": null,
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "recurring_text": "Past pattern: applications open in August, receipt acknowledged by the end of October, outcomes by the end of December. Not confirmed for 2027.",
          "recurring_months": [
            8
          ],
          "date_confidence": "recurring",
          "open_verified_on": null,
          "status_note": null,
          "source_url": "https://journeytoparenthooddotorg.wpcomstaging.com/application-html/"
        }
      ],
      "source_urls": [
        "https://journeytoparenthood.org/",
        "https://journeytoparenthood.org/application-html/"
      ],
      "last_verified_at": "2026-10-18",
      "verification_status": "verified",
      "research_notes": [
        "The official application address redirects to journeytoparenthooddotorg.wpcomstaging.com. The 2026 dates were read there."
      ],
      "requirements": {
        "married": null,
        "us_citizen": true,
        "us_status": true,
        "diagnosis": null,
        "no_children": false,
        "children_max": null,
        "employment": null,
        "health_insurance": null,
        "attend_event": null,
        "age_min": null,
        "age_max": null,
        "income_max": null,
        "other": [
          "You or your partner must be a U.S. citizen living in the U.S.",
          "Treatment by a reproductive endocrinologist in the U.S.",
          "Must show significant financial obstacles; no set income limit.",
          "Families with children may apply; family size is considered."
        ],
        "checked_on": "2026-10-18"
      },
      "links": [
        {
          "label": "Website",
          "url": "https://journeytoparenthood.org/"
        },
        {
          "label": "Application",
          "url": "https://journeytoparenthood.org/application-html/"
        },
        {
          "label": "FAQ",
          "url": "https://journeytoparenthood.org/faq/"
        }
      ],
      "decision_speed": {
        "text": "About 10 weeks after the deadline (2026: postmark deadline Oct 17, outcomes by Dec 31).",
        "days_max": 75,
        "basis": "after_deadline"
      }
    },
    {
      "id": "footprints-of-angels",
      "name": "Footprints of Angels",
      "program_name": "Annual Fertility Hope Award",
      "official_url": "https://www.footprintsofangels.org/",
      "application_url": null,
      "program_type": "Grant (annual award)",
      "geography": {
        "type": "unknown",
        "states": [],
        "text": "Not stated."
      },
      "clinic_required": false,
      "clinic_restrictions": "Any reproductive endocrinology practice the recipient chooses.",
      "treatments_covered": [
        "Medications",
        "IVF",
        "Egg freezing",
        "Donor eggs/sperm",
        "Embryo donation/adoption"
      ],
      "award_min": null,
      "award_max": 5000,
      "currency": "USD",
      "award_text": "Up to $5,000. The number of recipients depends on donations.",
      "application_fee": null,
      "fee_text": null,
      "eligibility_notes": [
        "For women affected by infertility and recurrent miscarriage. No other criteria are published."
      ],
      "coverage_notes": [],
      "cycles": [
        {
          "id": "footprints-of-angels-next",
          "cycle_label": "Next award",
          "cycle_year": null,
          "kind": "awaiting",
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "date_confidence": "not_announced",
          "open_verified_on": null,
          "status_note": "The site says to contact the organization about the application process. Its most recent listed recipients are from 2021.",
          "source_url": "https://www.footprintsofangels.org/"
        }
      ],
      "source_urls": [
        "https://www.footprintsofangels.org/"
      ],
      "last_verified_at": "2026-10-18",
      "verification_status": "partially_verified",
      "research_notes": [
        "Different organization from Footsteps for Fertility Foundation.",
        "Recipients listed for 2020 and 2021 only."
      ],
      "requirements": {
        "married": null,
        "us_citizen": null,
        "us_status": null,
        "diagnosis": null,
        "no_children": null,
        "children_max": null,
        "employment": null,
        "health_insurance": null,
        "attend_event": null,
        "age_min": null,
        "age_max": null,
        "income_max": null,
        "other": [
          "For women affected by infertility and recurrent miscarriage. Contact the organization for the application."
        ],
        "checked_on": "2026-10-18"
      },
      "links": [
        {
          "label": "Website",
          "url": "https://www.footprintsofangels.org/"
        }
      ]
    },
    {
      "id": "international-fertility-foundation",
      "name": "The International Fertility Foundation",
      "program_name": "Grant programs",
      "official_url": "https://www.internationalfertilityfoundation.org/",
      "application_url": null,
      "program_type": "Grant (status needs verification)",
      "geography": {
        "type": "unknown",
        "states": [],
        "text": "Not verified."
      },
      "clinic_required": null,
      "clinic_restrictions": null,
      "treatments_covered": [],
      "award_min": null,
      "award_max": null,
      "currency": "USD",
      "award_text": null,
      "application_fee": null,
      "fee_text": null,
      "eligibility_notes": [],
      "coverage_notes": [],
      "cycles": [
        {
          "id": "international-fertility-foundation-status",
          "cycle_label": "Program status needs verification",
          "cycle_year": null,
          "kind": "awaiting",
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "date_confidence": "not_announced",
          "open_verified_on": null,
          "status_note": "The organization's listed website did not load on October 18, 2026. Its LinkedIn profile describes fertility grants, but no cycle, eligibility, or amount could be verified.",
          "source_url": "https://www.linkedin.com/company/the-international-fertility-foundation"
        }
      ],
      "source_urls": [
        "https://www.internationalfertilityfoundation.org/",
        "https://www.linkedin.com/company/the-international-fertility-foundation"
      ],
      "last_verified_at": null,
      "verification_status": "unverified",
      "research_notes": [
        "Website could not be reached on October 18, 2026 (the address did not resolve). Shown as needing verification, not as open or closed."
      ],
      "requirements": {
        "married": null,
        "us_citizen": null,
        "us_status": null,
        "diagnosis": null,
        "no_children": null,
        "children_max": null,
        "employment": null,
        "health_insurance": null,
        "attend_event": null,
        "age_min": null,
        "age_max": null,
        "income_max": null,
        "other": [],
        "checked_on": "2026-10-18"
      },
      "links": [
        {
          "label": "LinkedIn profile (website not loading)",
          "url": "https://www.linkedin.com/company/the-international-fertility-foundation"
        }
      ]
    },
    {
      "id": "fertility-foundation-uk",
      "name": "The Fertility Foundation (United Kingdom)",
      "program_name": "IVF Grants",
      "official_url": "https://fertilityfoundation.org/ivf-grants/",
      "application_url": "https://fertilityfoundation.org/ivf-grants/",
      "program_type": "Grant",
      "geography": {
        "type": "international",
        "states": [],
        "country": "UK",
        "text": "United Kingdom only. British citizens living full time in the UK."
      },
      "clinic_required": false,
      "clinic_restrictions": null,
      "treatments_covered": [
        "IVF"
      ],
      "award_min": null,
      "award_max": 3000,
      "currency": "GBP",
      "award_text": "Up to £3,000 toward treatment.",
      "application_fee": 30,
      "fee_currency": "GBP",
      "fee_text": "£30, non-refundable (earlier research recorded £20).",
      "eligibility_notes": [
        "British citizens with no criminal record, living full time in the UK.",
        "Female applicant 42 or under. Couple must live together. At least one applicant in full-time work."
      ],
      "coverage_notes": [
        "Does not cover medication, surrogacy, or reversing other medical treatment.",
        "Treatment usually must begin within four months of receiving the grant."
      ],
      "cycles": [
        {
          "id": "fertility-foundation-uk-2026",
          "cycle_label": "2026 round",
          "cycle_year": 2026,
          "kind": "dated",
          "application_opens_at": {
            "date": "2026-01-01",
            "tz": "Europe/London"
          },
          "start_application_deadline_at": null,
          "submission_deadline_at": {
            "month": "2026-03",
            "note": "\"Our grants run from January to March each year.\""
          },
          "deadline_basis": "unknown",
          "notification_date": {
            "month": "2026-04",
            "note": "\"By the end of April 2026 all applicants will be informed.\""
          },
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": "Treatment usually must begin within four months of receiving the grant.",
          "expiration_rule": null,
          "date_confidence": "needs_confirmation",
          "open_verified_on": null,
          "status_note": "The same page also says no grants will be offered until 2028 because of lack of funding. It is unclear whether the 2026 round took place.",
          "source_url": "https://fertilityfoundation.org/ivf-grants/"
        },
        {
          "id": "fertility-foundation-uk-paused",
          "cycle_label": "Paused until 2028 (per official notice)",
          "cycle_year": null,
          "kind": "paused",
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "date_confidence": "needs_confirmation",
          "open_verified_on": null,
          "status_note": "Official notice: \"Due to lack of funding we will not be doing grants until 2028.\" The page also shows a \"Grants open\" label. Contact the foundation to confirm.",
          "source_url": "https://fertilityfoundation.org/ivf-grants/"
        }
      ],
      "source_urls": [
        "https://fertilityfoundation.org/ivf-grants/"
      ],
      "last_verified_at": "2026-10-18",
      "verification_status": "verified",
      "research_notes": [
        "Amounts are in British pounds (GBP). Keep separate from U.S. programs."
      ],
      "requirements": {
        "married": null,
        "us_citizen": null,
        "us_status": null,
        "diagnosis": null,
        "no_children": null,
        "children_max": null,
        "employment": true,
        "health_insurance": null,
        "attend_event": null,
        "age_min": null,
        "age_max": 42,
        "income_max": null,
        "other": [
          "British citizens living full time in the UK.",
          "Couples must live together.",
          "No criminal record."
        ],
        "checked_on": "2026-10-18"
      },
      "links": [
        {
          "label": "Website",
          "url": "https://www.fertilityfoundation.org/"
        },
        {
          "label": "IVF grants",
          "url": "https://fertilityfoundation.org/ivf-grants/"
        }
      ]
    },
    {
      "id": "starfish-infertility",
      "name": "Starfish Infertility Foundation",
      "program_name": "2026 Leighton Grant",
      "official_url": "https://www.starfishinfertilityfoundation.org/available-grants",
      "application_url": "https://www.starfishinfertilityfoundation.org/available-grants",
      "program_type": "Grant",
      "geography": {
        "type": "us_national",
        "states": [],
        "text": "Open to all U.S. residents (2026 Leighton Grant)."
      },
      "clinic_required": false,
      "clinic_restrictions": "Paid directly to the recipient's clinic. A third-party directory says other Starfish grants require a SART member clinic.",
      "treatments_covered": [
        "IVF"
      ],
      "award_min": null,
      "award_max": null,
      "currency": "USD",
      "award_text": "Not stated on the 2026 Leighton Grant page. A third-party directory lists other Starfish grants (Braxton, Bexleigh) at up to $5,000.",
      "application_fee": 50,
      "fee_text": "$50 application fee, paid when you submit.",
      "eligibility_notes": [
        "Open to all U.S. residents.",
        "Applications must be fully completed to be considered."
      ],
      "coverage_notes": [
        "Grant money is paid directly to the recipient's clinic."
      ],
      "cycles": [
        {
          "id": "starfish-2026-leighton",
          "cycle_label": "2026 Leighton Grant",
          "cycle_year": 2026,
          "kind": "dated",
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": {
            "date": "2026-11-30"
          },
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": "Recipients contacted by email or phone the week of December 14, 2026.",
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "date_confidence": "confirmed",
          "open_verified_on": "2026-10-18",
          "status_note": "The page said \"Apply for the 2026 Leighton Grant!\" on October 18, 2026.",
          "source_url": "https://www.starfishinfertilityfoundation.org/available-grants"
        }
      ],
      "source_urls": [
        "https://www.starfishinfertilityfoundation.org/available-grants"
      ],
      "last_verified_at": "2026-10-18",
      "verification_status": "verified",
      "research_notes": [],
      "requirements": {
        "married": null,
        "us_citizen": false,
        "us_status": true,
        "diagnosis": null,
        "no_children": null,
        "children_max": null,
        "employment": null,
        "health_insurance": null,
        "attend_event": null,
        "age_min": null,
        "age_max": null,
        "income_max": null,
        "other": [
          "The 2026 Leighton Grant is open to all U.S. residents."
        ],
        "checked_on": "2026-10-18"
      },
      "links": [
        {
          "label": "Website",
          "url": "https://www.starfishinfertilityfoundation.org/"
        },
        {
          "label": "Available grants",
          "url": "https://www.starfishinfertilityfoundation.org/available-grants"
        }
      ],
      "decision_speed": {
        "text": "About 2 weeks after the deadline (2026: deadline Nov 30, recipients contacted the week of Dec 14).",
        "days_max": 18,
        "basis": "after_deadline"
      }
    },
    {
      "id": "conceive-fertility-foundation",
      "name": "Conceive Fertility Foundation and The Wyatt Foundation",
      "program_name": "IVF Grant Program",
      "official_url": "https://cadenlane.com/pages/conceive-fertility-foundation-applications",
      "application_url": "https://yourivfgrant.com",
      "program_type": "Grant",
      "geography": {
        "type": "us_national",
        "states": [],
        "text": "Applicants from across the U.S. have applied. Full eligibility is on the application site."
      },
      "clinic_required": null,
      "clinic_restrictions": null,
      "treatments_covered": [
        "IVF",
        "PGT"
      ],
      "award_min": 15000,
      "award_max": 15000,
      "currency": "USD",
      "award_text": "$15,000 per grant. A partner press release says five grants for fall 2026, plus $1,000 toward PGT from CooperSurgical.",
      "application_fee": null,
      "fee_text": "No fee mentioned on the official page.",
      "eligibility_notes": [
        "Not listed on the page checked. See the application site."
      ],
      "coverage_notes": [],
      "cycles": [
        {
          "id": "conceive-2026-fall",
          "cycle_label": "Fall 2026",
          "cycle_year": 2026,
          "kind": "dated",
          "application_opens_at": {
            "date": "2026-09-14"
          },
          "start_application_deadline_at": null,
          "submission_deadline_at": {
            "date": "2026-11-09"
          },
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "date_confidence": "confirmed",
          "open_verified_on": "2026-10-18",
          "status_note": "Official page banner: \"Conceive Applications Open!\" and \"APPLY BY 11/9\".",
          "source_url": "https://cadenlane.com/pages/conceive-fertility-foundation-applications"
        }
      ],
      "source_urls": [
        "https://cadenlane.com/pages/conceive-fertility-foundation-applications"
      ],
      "last_verified_at": "2026-10-18",
      "verification_status": "verified",
      "research_notes": [
        "The foundation is the nonprofit arm of Caden Lane, a baby products brand. The program also ran in spring 2026."
      ],
      "requirements": {
        "married": null,
        "us_citizen": null,
        "us_status": null,
        "diagnosis": true,
        "no_children": null,
        "children_max": null,
        "employment": null,
        "health_insurance": null,
        "attend_event": null,
        "age_min": 25,
        "age_max": 42,
        "income_max": 150000,
        "other": [
          "Income limit: $100,000 for individuals, $150,000 for married couples (2024 Form 1040).",
          "Diagnosis from an OB/GYN or fertility specialist."
        ],
        "checked_on": "2026-10-18"
      },
      "links": [
        {
          "label": "Grant page",
          "url": "https://cadenlane.com/pages/conceive-fertility-foundation-applications"
        },
        {
          "label": "Apply and FAQ",
          "url": "https://yourivfgrant.com/"
        }
      ]
    },
    {
      "id": "stork-foundation",
      "name": "The Stork Foundation for Infertility",
      "program_name": "Fertility Grant",
      "official_url": "https://storkfoundation.org/",
      "application_url": "https://storkfoundation.org/",
      "program_type": "Grant",
      "geography": {
        "type": "us_national",
        "states": [],
        "text": "Both partners must be legal U.S. residents."
      },
      "clinic_required": null,
      "clinic_restrictions": null,
      "treatments_covered": [
        "IVF",
        "IUI",
        "Medications"
      ],
      "award_min": null,
      "award_max": 15000,
      "currency": "USD",
      "award_text": "Up to $15,000 (lifetime maximum per individual or couple). Recipients pay costs above that.",
      "application_fee": 0,
      "fee_text": "No application fee.",
      "eligibility_notes": [
        "Over 18. Household income $150,000 or less.",
        "Both partners must be legal U.S. residents.",
        "Formal infertility diagnosis, except same-sex couples, single applicants, or people recently diagnosed with cancer.",
        "Open regardless of gender, marital status, or sexual orientation."
      ],
      "coverage_notes": [
        "Treatment must begin within 6 months of the grant, and funds must be used within 1 year of starting treatment."
      ],
      "cycles": [
        {
          "id": "stork-2026",
          "cycle_label": "2026 grant",
          "cycle_year": 2026,
          "kind": "dated",
          "application_opens_at": {
            "date": "2026-08-01",
            "confidence": "needs_confirmation",
            "note": "From the foundation's July 2026 press release, not the official site."
          },
          "start_application_deadline_at": null,
          "submission_deadline_at": {
            "date": "2026-09-30",
            "time": "23:59",
            "tz": "America/New_York",
            "tz_label": "EST (as written)",
            "confidence": "needs_confirmation",
            "note": "The official homepage says \"close on September 30th\" without a year. The press release says September 30, 2026 at 11:59 p.m."
          },
          "deadline_basis": "submitted",
          "notification_date": null,
          "notification_window_text": "FAQ: applications reviewed in October; applicants get an email update by mid-November.",
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": "Begin treatment within 6 months of receiving the grant.",
          "expiration_rule": "Use funds within 1 year of the treatment start date.",
          "date_confidence": "needs_confirmation",
          "open_verified_on": null,
          "status_note": null,
          "source_url": "https://storkfoundation.org/"
        },
        {
          "id": "stork-2027",
          "cycle_label": "2027 grant",
          "cycle_year": 2027,
          "kind": "awaiting",
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "date_confidence": "not_announced",
          "open_verified_on": null,
          "status_note": null,
          "source_url": "https://storkfoundation.org/"
        }
      ],
      "source_urls": [
        "https://storkfoundation.org/",
        "https://storkfoundation.org/faq"
      ],
      "last_verified_at": "2026-10-18",
      "verification_status": "verified",
      "research_notes": [
        "The official FAQ confirms the award, fee, and eligibility. The 2026 window dates come from the foundation's press release."
      ],
      "requirements": {
        "married": false,
        "us_citizen": null,
        "us_status": true,
        "diagnosis": "some",
        "no_children": null,
        "children_max": null,
        "employment": null,
        "health_insurance": null,
        "attend_event": null,
        "age_min": 18,
        "age_max": null,
        "income_max": 150000,
        "other": [
          "Both partners must be legal U.S. residents.",
          "Diagnosis not required for same-sex couples, single applicants, or people recently diagnosed with cancer.",
          "If you have coverage, insurance is billed first; majority coverage makes you ineligible."
        ],
        "checked_on": "2026-10-18",
        "welcomes": [
          "single",
          "lgbtq",
          "cancer"
        ]
      },
      "links": [
        {
          "label": "Website",
          "url": "https://storkfoundation.org/"
        },
        {
          "label": "FAQ",
          "url": "https://storkfoundation.org/faq"
        }
      ],
      "decision_speed": {
        "text": "About 6 to 7 weeks after the deadline (reviews in October, email update by mid-November).",
        "days_max": 47,
        "basis": "after_deadline"
      }
    },
    {
      "id": "fertility-foundation-texas",
      "name": "The Fertility Foundation of Texas",
      "program_name": "Fertility Grant",
      "official_url": "https://www.fertilityfoundationoftexas.org/",
      "application_url": "https://www.fertilityfoundationoftexas.org/apply-for-a-grant/",
      "program_type": "Grant",
      "geography": {
        "type": "us_regional",
        "states": [
          "TX"
        ],
        "text": "Residents of 21 listed Central Texas counties, including Travis, Bexar, Williamson, Hays, Bell, and McLennan."
      },
      "clinic_required": true,
      "clinic_restrictions": "Treatment at a SART member clinic, under a board-certified reproductive endocrinologist.",
      "treatments_covered": [
        "General fertility treatment"
      ],
      "award_min": null,
      "award_max": 10000,
      "currency": "USD",
      "award_text": "One-time grants up to $10,000, twice a year.",
      "application_fee": null,
      "fee_text": null,
      "eligibility_notes": [
        "Household income between $40,000 and $150,000.",
        "Uninsured for fertility treatment, or coverage exhausted.",
        "Finalists are interviewed in person in Austin."
      ],
      "coverage_notes": [
        "Funds can't be used for physician fees."
      ],
      "cycles": [
        {
          "id": "fertility-foundation-texas-next",
          "cycle_label": "Next grant cycle",
          "cycle_year": null,
          "kind": "awaiting",
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "recurring_text": "Published deadlines: July 31 (summer grants) and December 31 (winter grants). No year given.",
          "recurring_months": [
            7,
            12
          ],
          "date_confidence": "recurring",
          "open_verified_on": null,
          "status_note": null,
          "source_url": "https://www.fertilityfoundationoftexas.org/apply-for-a-grant/"
        }
      ],
      "source_urls": [
        "https://www.fertilityfoundationoftexas.org/apply-for-a-grant/"
      ],
      "last_verified_at": "2026-10-18",
      "verification_status": "verified",
      "research_notes": [],
      "requirements": {
        "married": null,
        "us_citizen": null,
        "us_status": null,
        "diagnosis": true,
        "no_children": null,
        "children_max": null,
        "employment": null,
        "health_insurance": null,
        "attend_event": null,
        "age_min": null,
        "age_max": null,
        "income_max": 150000,
        "other": [
          "Household income between $40,000 and $150,000.",
          "Uninsured for fertility treatment, or coverage exhausted.",
          "Central Texas residents (21 listed counties)."
        ],
        "checked_on": "2026-10-18"
      },
      "links": [
        {
          "label": "Website",
          "url": "https://www.fertilityfoundationoftexas.org/"
        },
        {
          "label": "Apply for a grant",
          "url": "https://www.fertilityfoundationoftexas.org/apply-for-a-grant/"
        }
      ]
    },
    {
      "id": "hopeful-mama",
      "name": "Hopeful Mama Foundation",
      "program_name": "Hopeful Mama Grant",
      "official_url": "https://hopefulmamafoundation.org/grant/",
      "application_url": "https://hopefulmamafoundation.org/grant/",
      "program_type": "Grant",
      "geography": {
        "type": "us_national",
        "states": [],
        "text": "U.S. citizens or permanent residents treated at a U.S. accredited clinic."
      },
      "clinic_required": false,
      "clinic_restrictions": null,
      "treatments_covered": [
        "General fertility treatment",
        "Donor eggs/sperm",
        "Medications"
      ],
      "award_min": 500,
      "award_max": 30000,
      "currency": "USD",
      "award_text": "$500 to $30,000 for the 2026 cycle. Paid to the clinic and/or pharmacy.",
      "application_fee": 0,
      "fee_text": "No application fee.",
      "eligibility_notes": [
        "Documented female factor infertility diagnosis.",
        "Demonstrated financial need and basic medical insurance for mother and baby.",
        "Recipients wait one full cycle before reapplying."
      ],
      "coverage_notes": [
        "Male factor infertility and storage fees aren't covered.",
        "Funds must be used within 12 months. No reimbursement for past treatment."
      ],
      "cycles": [
        {
          "id": "hopeful-mama-2027",
          "cycle_label": "2027 grant",
          "cycle_year": 2027,
          "kind": "awaiting",
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": "Funds must be used within 12 months.",
          "recurring_text": "Published pattern: opens every year April 1 and closes May 9. Recipients notified on or before June 30. Not confirmed for 2027.",
          "recurring_months": [
            4,
            5
          ],
          "date_confidence": "recurring",
          "open_verified_on": null,
          "status_note": "The application was closed on October 18, 2026.",
          "source_url": "https://hopefulmamafoundation.org/grant/"
        }
      ],
      "source_urls": [
        "https://hopefulmamafoundation.org/grant/"
      ],
      "last_verified_at": "2026-10-18",
      "verification_status": "verified",
      "research_notes": [],
      "requirements": {
        "married": null,
        "us_citizen": null,
        "us_status": true,
        "diagnosis": true,
        "no_children": null,
        "children_max": null,
        "employment": null,
        "health_insurance": true,
        "attend_event": null,
        "age_min": null,
        "age_max": null,
        "income_max": null,
        "other": [
          "Female factor infertility diagnosis.",
          "Demonstrated financial need."
        ],
        "checked_on": "2026-10-18"
      },
      "links": [
        {
          "label": "Website",
          "url": "https://hopefulmamafoundation.org/"
        },
        {
          "label": "Grant details",
          "url": "https://hopefulmamafoundation.org/grant/"
        }
      ],
      "decision_speed": {
        "text": "About 7 weeks after the deadline (closes May 9, recipients notified by June 30).",
        "days_max": 52,
        "basis": "after_deadline"
      }
    },
    {
      "id": "jewish-fertility-foundation",
      "name": "Jewish Fertility Foundation",
      "program_name": "JFF Grants",
      "official_url": "https://jewishfertilityfoundation.org/grants/",
      "application_url": "https://jewishfertilityfoundation.org/grants/",
      "program_type": "Grant",
      "geography": {
        "type": "us_regional",
        "states": [
          "GA",
          "AL",
          "OH",
          "CO",
          "MI",
          "DC",
          "MD",
          "VA",
          "PA",
          "FL",
          "TX",
          "NV"
        ],
        "text": "Must live in a JFF community: Atlanta, Birmingham, Cincinnati, Cleveland, Denver, Detroit, Greater DC, Houston, Nevada, Pittsburgh, or South Florida. The site also lists a National program."
      },
      "clinic_required": true,
      "clinic_restrictions": "Treatment at a JFF partner clinic.",
      "treatments_covered": [
        "IVF",
        "IUI",
        "FET",
        "Surrogacy"
      ],
      "award_min": 1000,
      "award_max": 10000,
      "currency": "USD",
      "award_text": "IVF $1,000 to $10,000. IUI $1,000. Frozen embryo transfer $2,500. Surrogacy (medical portion) up to $10,000.",
      "application_fee": null,
      "fee_text": "No application fee stated.",
      "eligibility_notes": [
        "At least one Jewish parent intending to raise the child Jewish.",
        "Non-smoker and non-drug user. May already have up to one child.",
        "Up to 1 IUI grant and 2 IVF grants per person or couple."
      ],
      "coverage_notes": [
        "Apply before starting or paying for treatment. Not retroactive.",
        "Use within six months. Paid directly to the clinic.",
        "Egg freezing is not covered."
      ],
      "cycles": [
        {
          "id": "jff-rolling",
          "cycle_label": "Rolling applications",
          "cycle_year": null,
          "kind": "rolling",
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": "Decisions generally within 6 to 8 weeks after the application is received.",
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": "Use within six months.",
          "date_confidence": "confirmed",
          "open_verified_on": "2026-10-18",
          "status_note": "No application window or annual deadline is listed.",
          "source_url": "https://jewishfertilityfoundation.org/grants/"
        },
        {
          "id": "jff-2027-surrogacy",
          "cycle_label": "2027 Surrogacy Grant",
          "cycle_year": 2027,
          "kind": "awaiting",
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "date_confidence": "not_announced",
          "open_verified_on": null,
          "status_note": "\"Stay tuned for the 2027 Surrogacy Grant Application & Eligibility Requirements, coming soon.\"",
          "source_url": "https://jewishfertilityfoundation.org/grants/"
        }
      ],
      "source_urls": [
        "https://jewishfertilityfoundation.org/grants/"
      ],
      "last_verified_at": "2026-10-18",
      "verification_status": "verified",
      "research_notes": [],
      "requirements": {
        "married": null,
        "us_citizen": null,
        "us_status": null,
        "diagnosis": null,
        "no_children": null,
        "children_max": 1,
        "employment": null,
        "health_insurance": null,
        "attend_event": null,
        "age_min": null,
        "age_max": null,
        "income_max": null,
        "other": [
          "At least one Jewish parent intending to raise the child Jewish.",
          "Must live in a JFF community.",
          "Non-smoker and non-drug user."
        ],
        "checked_on": "2026-10-18"
      },
      "links": [
        {
          "label": "Website",
          "url": "https://jewishfertilityfoundation.org/"
        },
        {
          "label": "Grants",
          "url": "https://jewishfertilityfoundation.org/grants/"
        }
      ],
      "decision_speed": {
        "text": "Generally 6 to 8 weeks after your application is received.",
        "days_max": 56,
        "basis": "after_applying"
      }
    },
    {
      "id": "giving-grace",
      "name": "The Giving Grace Foundation",
      "program_name": "Giving Grace Grant",
      "official_url": "https://www.givinggracemn.org",
      "application_url": "https://www.givinggracemn.org/how-to-apply",
      "program_type": "Grant",
      "geography": {
        "type": "us_regional",
        "states": [
          "MN"
        ],
        "text": "Permanent Minnesota residents under the care of an accredited U.S. fertility facility."
      },
      "clinic_required": false,
      "clinic_restrictions": null,
      "treatments_covered": [
        "IVF"
      ],
      "award_min": 500,
      "award_max": 1500,
      "currency": "USD",
      "award_text": "$500 to $1,500, paid directly to the clinic within six months of the award.",
      "application_fee": null,
      "fee_text": null,
      "eligibility_notes": [
        "Infertility evaluation done and treatment plan in place.",
        "At least one partner employed. Basic health insurance for mother and baby.",
        "Must be in active treatment. IUI is not covered."
      ],
      "coverage_notes": [
        "Grant is forfeited if not used within six months of the award, unless an exception is granted."
      ],
      "cycles": [
        {
          "id": "giving-grace-next",
          "cycle_label": "Next annual cycle",
          "cycle_year": null,
          "kind": "awaiting",
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "deadline_basis": "receipt",
          "notification_date": null,
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "recurring_text": "Published pattern: applications and release forms must be received by December 31. Applicants notified about 4 to 8 weeks later; grants awarded in February. No year given.",
          "recurring_months": [
            12
          ],
          "date_confidence": "recurring",
          "open_verified_on": null,
          "status_note": null,
          "source_url": "https://www.givinggracemn.org/how-to-apply"
        }
      ],
      "source_urls": [
        "https://www.givinggracemn.org/how-to-apply"
      ],
      "last_verified_at": "2026-10-18",
      "verification_status": "verified",
      "research_notes": [],
      "requirements": {
        "married": null,
        "us_citizen": null,
        "us_status": null,
        "diagnosis": true,
        "no_children": null,
        "children_max": null,
        "employment": true,
        "health_insurance": true,
        "attend_event": null,
        "age_min": null,
        "age_max": null,
        "income_max": null,
        "other": [
          "Permanent Minnesota residents in active treatment."
        ],
        "checked_on": "2026-10-18"
      },
      "links": [
        {
          "label": "Website",
          "url": "https://www.givinggracemn.org/"
        },
        {
          "label": "How to apply",
          "url": "https://www.givinggracemn.org/how-to-apply"
        }
      ],
      "decision_speed": {
        "text": "About 4 to 8 weeks after the deadline.",
        "days_max": 56,
        "basis": "after_deadline"
      }
    },
    {
      "id": "aneden-gives",
      "name": "ANEDEN Gives",
      "program_name": "Houston / Seattle Grant",
      "official_url": "https://www.anedengives.com/",
      "application_url": "https://www.anedengives.com/grant-process/",
      "program_type": "Grant",
      "geography": {
        "type": "us_regional",
        "states": [
          "TX",
          "WA"
        ],
        "text": "Patients of Aspire HFI (Houston, Texas) or Pacific NW Fertility (Seattle, Washington). A separate grant serves Lagos, Nigeria."
      },
      "clinic_required": true,
      "clinic_restrictions": "Aspire HFI (Houston) or Pacific NW Fertility (Seattle).",
      "treatments_covered": [
        "General fertility treatment"
      ],
      "award_min": 5000,
      "award_max": 7500,
      "currency": "USD",
      "award_text": "$5,000 to $7,500 per grant.",
      "application_fee": null,
      "fee_text": null,
      "eligibility_notes": [
        "No fertility insurance coverage (exhausted coverage is OK).",
        "Income limits apply. Legally allowed to live and/or work in the U.S. At least 21 years old.",
        "Background check for pre-selected applicants."
      ],
      "coverage_notes": [],
      "cycles": [
        {
          "id": "aneden-2026",
          "cycle_label": "2026 Houston and Seattle grant",
          "cycle_year": 2026,
          "kind": "dated",
          "application_opens_at": {
            "date": "2026-05-01"
          },
          "start_application_deadline_at": null,
          "submission_deadline_at": {
            "date": "2026-05-31"
          },
          "deadline_basis": "unknown",
          "notification_date": {
            "date": "2026-08-16",
            "note": "Pre-selection and notification August 10 to 16, 2026."
          },
          "notification_window_text": "Review June 1 to August 9, 2026.",
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "date_confidence": "confirmed",
          "open_verified_on": null,
          "status_note": "The official page says the 2026 process is complete.",
          "source_url": "https://www.anedengives.com/grant-process/"
        },
        {
          "id": "aneden-2027",
          "cycle_label": "2027 Houston and Seattle grant",
          "cycle_year": 2027,
          "kind": "awaiting",
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "date_confidence": "not_announced",
          "open_verified_on": null,
          "status_note": null,
          "source_url": "https://www.anedengives.com/grant-process/"
        }
      ],
      "source_urls": [
        "https://www.anedengives.com/grant-process/"
      ],
      "last_verified_at": "2026-10-18",
      "verification_status": "verified",
      "research_notes": [],
      "requirements": {
        "married": null,
        "us_citizen": null,
        "us_status": true,
        "diagnosis": null,
        "no_children": null,
        "children_max": null,
        "employment": null,
        "health_insurance": null,
        "attend_event": null,
        "age_min": 21,
        "age_max": null,
        "income_max": null,
        "other": [
          "Must be legally allowed to live and/or work in the U.S.",
          "No fertility insurance coverage (exhausted coverage is OK).",
          "Income limits apply."
        ],
        "checked_on": "2026-10-18"
      },
      "links": [
        {
          "label": "Website",
          "url": "https://www.anedengives.com/"
        },
        {
          "label": "Houston and Seattle grant",
          "url": "https://www.anedengives.com/grant-process/"
        },
        {
          "label": "Lagos grant",
          "url": "https://www.anedengives.com/lagos-grant/"
        }
      ],
      "decision_speed": {
        "text": "About 11 weeks after the deadline (2026: closed May 31, notified Aug 10–16).",
        "days_max": 77,
        "basis": "after_deadline"
      }
    },
    {
      "id": "bivf-foundation",
      "name": "The BIVF Foundation",
      "program_name": "IVF Cycle, Oncofertility, and Financial Assistance Grants",
      "official_url": "https://www.bivffoundation.org/grants",
      "application_url": "https://www.bivffoundation.org/grants",
      "program_type": "Grant and donated IVF cycle",
      "geography": {
        "type": "us_regional",
        "states": [
          "ME",
          "MA",
          "NH",
          "RI"
        ],
        "text": "Residents of Maine, Massachusetts, New Hampshire, or Rhode Island, treated at a SART center in those states."
      },
      "clinic_required": true,
      "clinic_restrictions": "SART-qualified or SART-accredited center in ME, MA, NH, or RI.",
      "treatments_covered": [
        "IVF",
        "IUI",
        "Medications",
        "Egg freezing",
        "Adoption"
      ],
      "award_min": null,
      "award_max": 10000,
      "currency": "USD",
      "award_text": "Financial assistance up to $10,000. Also a donated IVF cycle and an oncofertility egg freezing cycle.",
      "application_fee": 25,
      "fee_text": "$25, non-refundable.",
      "eligibility_notes": [
        "Limited or no IVF insurance coverage. Two or fewer children.",
        "Household income under $200,000.",
        "Age, BMI, FSH, and AMH limits apply for some treatments."
      ],
      "coverage_notes": [
        "Paid to the clinic. Use within 12 months. Future treatment only."
      ],
      "cycles": [
        {
          "id": "bivf-2025",
          "cycle_label": "2025 grants",
          "cycle_year": 2025,
          "kind": "dated",
          "application_opens_at": {
            "date": "2025-01-13"
          },
          "start_application_deadline_at": null,
          "submission_deadline_at": {
            "date": "2025-03-10"
          },
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": "Recipients announced shortly after the application period.",
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": "12 months to use funds.",
          "date_confidence": "historical",
          "open_verified_on": null,
          "status_note": null,
          "source_url": "https://www.bivffoundation.org/grants"
        },
        {
          "id": "bivf-next",
          "cycle_label": "Next annual cycle",
          "cycle_year": null,
          "kind": "awaiting",
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "date_confidence": "not_announced",
          "open_verified_on": null,
          "status_note": "All three grants were marked \"Now Closed\" on October 18, 2026, and the page still linked to the 2025 application. No 2026 or 2027 dates were found.",
          "source_url": "https://www.bivffoundation.org/grants"
        }
      ],
      "source_urls": [
        "https://www.bivffoundation.org/grants"
      ],
      "last_verified_at": "2026-10-18",
      "verification_status": "verified",
      "research_notes": [
        "Connected to Boston IVF.",
        "The grants page lists questions@bivffoundation.org for questions. As of October 19, 2026, all three grants were still marked \"Now Closed\" with no 2026 or 2027 dates."
      ],
      "requirements": {
        "married": null,
        "us_citizen": null,
        "us_status": null,
        "diagnosis": true,
        "no_children": null,
        "children_max": 2,
        "employment": null,
        "health_insurance": null,
        "attend_event": null,
        "age_min": null,
        "age_max": null,
        "income_max": 200000,
        "other": [
          "Limited or no IVF insurance coverage.",
          "Age, BMI, and hormone limits apply for some treatments."
        ],
        "checked_on": "2026-10-18",
        "welcomes": [
          "single",
          "lgbtq",
          "cancer"
        ]
      },
      "links": [
        {
          "label": "Website",
          "url": "https://www.bivffoundation.org/"
        },
        {
          "label": "Grants",
          "url": "https://www.bivffoundation.org/grants"
        }
      ]
    },
    {
      "award_min": null,
      "award_max": null,
      "currency": "USD",
      "clinic_required": null,
      "clinic_restrictions": null,
      "last_verified_at": "2026-10-19",
      "verification_status": "verified",
      "research_notes": [],
      "id": "men-having-babies",
      "name": "Men Having Babies",
      "program_name": "Gay Parenting Assistance Program (GPAP)",
      "official_url": "https://menhavingbabies.org/assistance/",
      "application_url": "https://menhavingbabies.org/assistance/application1/",
      "program_type": "Discounts, free services, and small cash grants",
      "geography": {
        "type": "us_national",
        "states": [],
        "text": "Residents of the USA, Canada, Taiwan, Israel, and several European countries have full access. Residents of some other countries can use Stage I only."
      },
      "treatments_covered": [
        "Surrogacy",
        "IVF",
        "Donor eggs/sperm"
      ],
      "award_text": "Stage I: discounts from participating IVF, surrogacy, egg donation, and legal providers. Stage II: free services and small cash grants (about $1,000,000 in free services awarded each year). Individual amounts aren't published.",
      "application_fee": null,
      "fee_text": "No application fee for Supporting Members of Men Having Babies. The membership price isn't stated on the assistance page.",
      "eligibility_notes": [
        "For gay prospective parents; individuals or couples can apply.",
        "Must be a Supporting Member of Men Having Babies in good standing.",
        "Stage I is based on income and other criteria. Stage II applicants are typically expected to cover at least 30–40% of total U.S. journey costs."
      ],
      "coverage_notes": [
        "Stage I discounts are limited each calendar year.",
        "Stage I recipients can't run parallel journeys with GPAP discounts."
      ],
      "links": [
        {
          "label": "Website",
          "url": "https://menhavingbabies.org/"
        },
        {
          "label": "Financial assistance (GPAP)",
          "url": "https://menhavingbabies.org/assistance/"
        },
        {
          "label": "Eligibility and criteria",
          "url": "https://menhavingbabies.org/assistance/criteria/"
        },
        {
          "label": "Stage I application",
          "url": "https://menhavingbabies.org/assistance/application1/"
        }
      ],
      "requirements": {
        "married": null,
        "us_citizen": null,
        "us_status": null,
        "diagnosis": null,
        "no_children": null,
        "children_max": null,
        "employment": null,
        "health_insurance": null,
        "attend_event": null,
        "age_min": null,
        "age_max": null,
        "income_max": null,
        "other": [
          "Supporting Member of Men Having Babies.",
          "Stage II: contribute typically at least 30–40% of total costs."
        ],
        "checked_on": "2026-10-19",
        "welcomes": [
          "single",
          "lgbtq"
        ]
      },
      "cycles": [
        {
          "cycle_year": null,
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "open_verified_on": "2026-10-19",
          "status_note": "Stage I applications are accepted year-round.",
          "id": "mhb-stage1",
          "cycle_label": "Stage I discounts (year-round)",
          "kind": "rolling",
          "date_confidence": "confirmed",
          "source_url": "https://menhavingbabies.org/assistance/"
        },
        {
          "cycle_year": 2027,
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "open_verified_on": null,
          "status_note": null,
          "id": "mhb-stage2-2027",
          "cycle_label": "Stage II direct assistance, 2027",
          "kind": "awaiting",
          "recurring_text": "Published pattern: Stage II applications are accepted February 1 to March 31 each year, and awards are typically made by the end of the year. Eligible Stage I recipients are invited to apply. Not confirmed for 2027.",
          "recurring_months": [
            2,
            3
          ],
          "date_confidence": "recurring",
          "source_url": "https://menhavingbabies.org/assistance/"
        }
      ],
      "source_urls": [
        "https://menhavingbabies.org/assistance/",
        "https://menhavingbabies.org/assistance/criteria/"
      ]
    },
    {
      "award_min": null,
      "award_max": 100000,
      "currency": "USD",
      "clinic_required": null,
      "clinic_restrictions": null,
      "last_verified_at": "2026-10-19",
      "verification_status": "verified",
      "research_notes": [
        "RESOLVE's directory listed the 2025 window as closing December 31, 2025."
      ],
      "id": "surrogacy-foundation",
      "name": "The Surrogacy Foundation",
      "program_name": "National Surrogacy Grant",
      "official_url": "https://www.thesurrogacyfoundation.org/",
      "application_url": "https://www.thesurrogacyfoundation.org/grants",
      "program_type": "Grant (placed in escrow)",
      "geography": {
        "type": "unknown",
        "states": [],
        "text": "Not stated on the official grants page."
      },
      "treatments_covered": [
        "Surrogacy"
      ],
      "award_text": "$100,000 placed in escrow for surrogacy expenses (annual grant). A separate Hatch Full Journey Grant was also awarded in 2025.",
      "application_fee": null,
      "fee_text": "No application fee is listed on the grants page.",
      "eligibility_notes": [
        "Applications are evaluated on medical, financial, and personal criteria by independent professionals.",
        "A third-party directory (RESOLVE) lists U.S. residency, medical necessity, and at least three euploid embryos created in the U.S. Not confirmed on the official page."
      ],
      "coverage_notes": [
        "Funds are held in escrow for surrogacy expenses. Families choose their own professionals."
      ],
      "links": [
        {
          "label": "Website",
          "url": "https://www.thesurrogacyfoundation.org/"
        },
        {
          "label": "Grants",
          "url": "https://www.thesurrogacyfoundation.org/grants"
        }
      ],
      "requirements": {
        "married": null,
        "us_citizen": null,
        "us_status": null,
        "diagnosis": null,
        "no_children": null,
        "children_max": null,
        "employment": null,
        "health_insurance": null,
        "attend_event": null,
        "age_min": null,
        "age_max": null,
        "income_max": null,
        "other": [
          "Eligibility isn't listed on the official grants page. Check before applying."
        ],
        "checked_on": "2026-10-19"
      },
      "cycles": [
        {
          "cycle_year": null,
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "open_verified_on": null,
          "status_note": "The grants page shows 2025 winners and doesn't give dates for the next application window (checked October 19, 2026).",
          "id": "surrogacy-foundation-next",
          "cycle_label": "Next national grant",
          "kind": "awaiting",
          "date_confidence": "not_announced",
          "source_url": "https://www.thesurrogacyfoundation.org/grants"
        }
      ],
      "source_urls": [
        "https://www.thesurrogacyfoundation.org/grants"
      ]
    },
    {
      "award_min": null,
      "award_max": null,
      "currency": "USD",
      "clinic_required": true,
      "clinic_restrictions": "Must use a SART member clinic, which provides a W-9 to the foundation.",
      "last_verified_at": "2026-10-19",
      "verification_status": "verified",
      "research_notes": [
        "The page also notes that the VA offers infertility services to enrolled, eligible veterans regardless of service connection, sexual orientation, gender identity, relationship status, or marital status. Veterans can call (855) 829-6636 to reach a Women Veteran Program Manager."
      ],
      "id": "bob-woodruff-viva",
      "name": "Bob Woodruff Foundation",
      "program_name": "VIVA Fertility Grants",
      "official_url": "https://bobwoodrufffoundation.org/for-veterans/fertility-grants-viva-program/",
      "application_url": "https://bobwoodrufffoundation.org/for-veterans/fertility-grants-viva-program/",
      "program_type": "Grant",
      "geography": {
        "type": "us_national",
        "states": [],
        "text": "U.S. veterans. Treatment at a SART member clinic."
      },
      "treatments_covered": [
        "IVF",
        "Donor eggs/sperm",
        "Surrogacy",
        "General fertility treatment"
      ],
      "award_text": "Amount not stated on the official page. The foundation says it funds donor sperm, eggs, and surrogates, with broader criteria than the VA program.",
      "application_fee": null,
      "fee_text": "No fee mentioned on the official page.",
      "eligibility_notes": [
        "The veteran must have a service-connected condition causing infertility.",
        "Wounds or injuries don't have to involve reproductive organs; spinal injuries, PTSD, or TBI are considered case by case.",
        "Apply through the Got Your 6 Network grantee portal (choose \"I'm an individual applying for fertility assistance\")."
      ],
      "coverage_notes": [
        "If approved, the check goes to the fertility center."
      ],
      "decision_speed": {
        "text": "Decision within a few days of a complete application (the foundation aims to respond within one week). The check goes to the clinic in about a month.",
        "days_max": 7,
        "basis": "after_applying"
      },
      "links": [
        {
          "label": "VIVA fertility grants",
          "url": "https://bobwoodrufffoundation.org/for-veterans/fertility-grants-viva-program/"
        },
        {
          "label": "Website",
          "url": "https://bobwoodrufffoundation.org/"
        }
      ],
      "requirements": {
        "married": null,
        "us_citizen": null,
        "us_status": null,
        "diagnosis": null,
        "no_children": null,
        "children_max": null,
        "employment": null,
        "health_insurance": null,
        "attend_event": null,
        "age_min": null,
        "age_max": null,
        "income_max": null,
        "other": [
          "Service-connected condition causing infertility.",
          "SART member clinic."
        ],
        "checked_on": "2026-10-19",
        "welcomes": [
          "military"
        ],
        "only": "military"
      },
      "cycles": [
        {
          "cycle_year": null,
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": "Decision within a few days of a complete application.",
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "open_verified_on": "2026-10-19",
          "status_note": "\"We review applications as we receive them.\"",
          "id": "viva-rolling",
          "cycle_label": "Rolling applications",
          "kind": "rolling",
          "date_confidence": "confirmed",
          "source_url": "https://bobwoodrufffoundation.org/for-veterans/fertility-grants-viva-program/"
        }
      ],
      "source_urls": [
        "https://bobwoodrufffoundation.org/for-veterans/fertility-grants-viva-program/"
      ]
    },
    {
      "award_min": null,
      "award_max": null,
      "currency": "USD",
      "clinic_required": true,
      "clinic_restrictions": "The application is submitted by an onboarded partner fertility clinic, before the fertility cycle starts.",
      "last_verified_at": "2026-10-19",
      "verification_status": "verified",
      "research_notes": [
        "A third-party article says Hope Grants can be approved in as little as 48 hours. Not stated on the official page."
      ],
      "id": "chick-mission",
      "name": "The Chick Mission",
      "program_name": "Hope Grants",
      "official_url": "https://www.thechickmission.org/hope-grants/",
      "application_url": "https://www.thechickmission.org/hope-grants/",
      "program_type": "Grant (applied for by a partner clinic)",
      "geography": {
        "type": "us_regional",
        "states": [
          "CA",
          "CO",
          "FL",
          "IL",
          "MT",
          "NJ",
          "NY",
          "OK",
          "PA",
          "TX"
        ],
        "text": "California, Colorado, Florida, Illinois, Montana, New Jersey, New York, Oklahoma, Pennsylvania, and Texas."
      },
      "treatments_covered": [
        "Egg freezing"
      ],
      "award_text": "Covers costs of an egg-freezing cycle; amount based on financial need, insurance, and treatment plan. Doesn't cover medications.",
      "application_fee": null,
      "fee_text": "No fee mentioned on the official page.",
      "eligibility_notes": [
        "Women ages 18 to 40, newly diagnosed with cancer, with a treatment plan that poses an immediate risk to fertility (confirmed by an oncologist).",
        "U.S. citizen or lawfully present in the U.S.",
        "Household income under $150,000 (single) or $200,000 (married or domestic partnership).",
        "No prior treatment that may have lowered fertility (recurrences reviewed individually).",
        "The form on the page is an inquiry, not the application; your clinic applies."
      ],
      "coverage_notes": [
        "Doesn't cover medication costs.",
        "Paid to the partner clinic after the final invoice.",
        "One grant per person."
      ],
      "links": [
        {
          "label": "Hope Grants",
          "url": "https://www.thechickmission.org/hope-grants/"
        },
        {
          "label": "Website",
          "url": "https://www.thechickmission.org/"
        }
      ],
      "requirements": {
        "married": null,
        "us_citizen": null,
        "us_status": true,
        "diagnosis": true,
        "no_children": null,
        "children_max": null,
        "employment": null,
        "health_insurance": null,
        "attend_event": null,
        "age_min": 18,
        "age_max": 40,
        "income_max": 200000,
        "other": [
          "New cancer diagnosis with treatment that threatens fertility.",
          "Income limit: under $150,000 single, $200,000 married or partnered."
        ],
        "checked_on": "2026-10-19",
        "welcomes": [
          "cancer",
          "single"
        ],
        "only": "cancer"
      },
      "cycles": [
        {
          "cycle_year": null,
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "open_verified_on": "2026-10-19",
          "status_note": "Submitted by a partner clinic before the egg-freezing cycle starts. The page doesn't state a decision timeline.",
          "id": "chick-mission-rolling",
          "cycle_label": "Before your fertility cycle starts",
          "kind": "rolling",
          "date_confidence": "confirmed",
          "source_url": "https://www.thechickmission.org/hope-grants/"
        }
      ],
      "source_urls": [
        "https://www.thechickmission.org/hope-grants/"
      ]
    },
    {
      "award_min": null,
      "award_max": null,
      "currency": "USD",
      "clinic_required": true,
      "clinic_restrictions": "Livestrong partner fertility clinic.",
      "last_verified_at": "2026-10-19",
      "verification_status": "verified",
      "research_notes": [
        "Another Livestrong page lists different income limits and U.S. citizen or permanent resident. Confirm with Livestrong."
      ],
      "id": "livestrong-fertility",
      "name": "Livestrong",
      "program_name": "Livestrong Fertility",
      "official_url": "https://livestrong.org/how-we-help/livestrong-fertility/",
      "application_url": "https://livestrong.org/how-we-help/livestrong-fertility/",
      "program_type": "Discounts and free medication (not a cash grant)",
      "geography": {
        "type": "us_national",
        "states": [],
        "text": "Lawfully present in the United States. Must use a Livestrong partner clinic."
      },
      "treatments_covered": [
        "Egg freezing",
        "Medications"
      ],
      "award_text": "At least 25% off services at partner clinics, plus free fertility stimulation medication (through EMD Serono) for approved patients.",
      "application_fee": 0,
      "fee_text": "No application fee charged to applicants.",
      "eligibility_notes": [
        "Confirmed cancer diagnosis (or an oncologist actively involved in your care), and your oncology team agrees treatment could affect fertility.",
        "Income: birthing parents $130,000 or less (single) or $170,000 (married); non-birthing parents $101,000 or $130,000.",
        "Uninsured or limited coverage for fertility preservation.",
        "Complete Livestrong's checklist (diagnosis, partner clinic, insurance check, oncologist letter) to get the application link."
      ],
      "coverage_notes": [
        "Not all costs are covered; you contribute too."
      ],
      "links": [
        {
          "label": "Livestrong Fertility",
          "url": "https://livestrong.org/how-we-help/livestrong-fertility/"
        }
      ],
      "requirements": {
        "married": null,
        "us_citizen": null,
        "us_status": true,
        "diagnosis": true,
        "no_children": null,
        "children_max": null,
        "employment": null,
        "health_insurance": null,
        "attend_event": null,
        "age_min": null,
        "age_max": null,
        "income_max": 170000,
        "other": [
          "Cancer diagnosis with fertility-threatening treatment.",
          "Income limits differ for birthing and non-birthing parents."
        ],
        "checked_on": "2026-10-19",
        "welcomes": [
          "cancer",
          "single"
        ],
        "only": "cancer"
      },
      "cycles": [
        {
          "cycle_year": null,
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "open_verified_on": "2026-10-19",
          "status_note": "The page doesn't state a deadline or processing time. Case management: (855) 844-7777, weekdays 8:30 a.m.–5 p.m. ET.",
          "id": "livestrong-rolling",
          "cycle_label": "Rolling applications",
          "kind": "rolling",
          "date_confidence": "confirmed",
          "source_url": "https://livestrong.org/how-we-help/livestrong-fertility/"
        }
      ],
      "source_urls": [
        "https://livestrong.org/how-we-help/livestrong-fertility/"
      ]
    },
    {
      "award_min": null,
      "award_max": 2500,
      "currency": "USD",
      "clinic_required": false,
      "clinic_restrictions": null,
      "last_verified_at": "2026-10-19",
      "verification_status": "verified",
      "research_notes": [],
      "id": "team-maggies-dream",
      "name": "Team Maggie's Dream",
      "program_name": "Fertility Assistance Grants",
      "official_url": "https://www.teammaggiesdream.org/grants",
      "application_url": "https://www.teammaggiesdream.org/grants",
      "program_type": "Grant (mailed application)",
      "geography": {
        "type": "us_national",
        "states": [],
        "text": "U.S. residents who are U.S. citizens, uninsured or underinsured."
      },
      "treatments_covered": [
        "Egg freezing"
      ],
      "award_text": "Up to $2,500, depending on funds, number of qualified applicants, and need. Paid directly to the medical provider.",
      "application_fee": null,
      "fee_text": "No fee mentioned on the official page.",
      "eligibility_notes": [
        "Ages 15 to 37, receiving treatment for cancer.",
        "U.S. citizen; uninsured or underinsured.",
        "Must have been denied coverage by your insurance carrier.",
        "Mail the completed application with a short explanation and documentation of financial need and medical treatment."
      ],
      "coverage_notes": [
        "Fertility preservation expenses, including egg retrieval (egg or sperm preservation).",
        "Priority may go to applicants without children."
      ],
      "links": [
        {
          "label": "Grants",
          "url": "https://www.teammaggiesdream.org/grants"
        }
      ],
      "requirements": {
        "married": null,
        "us_citizen": true,
        "us_status": true,
        "diagnosis": true,
        "no_children": null,
        "children_max": null,
        "employment": null,
        "health_insurance": null,
        "attend_event": null,
        "age_min": 15,
        "age_max": 37,
        "income_max": null,
        "other": [
          "Receiving treatment for cancer.",
          "Insurance denied coverage."
        ],
        "checked_on": "2026-10-19",
        "welcomes": [
          "cancer",
          "single"
        ],
        "only": "cancer"
      },
      "cycles": [
        {
          "cycle_year": null,
          "application_opens_at": null,
          "start_application_deadline_at": null,
          "submission_deadline_at": null,
          "deadline_basis": "unknown",
          "notification_date": null,
          "notification_window_text": null,
          "funds_available_date": null,
          "funds_available_text": null,
          "treatment_start_rule": null,
          "expiration_rule": null,
          "open_verified_on": null,
          "status_note": "The page lists no deadlines and doesn't say whether applications are rolling. Questions: teammaggieforacure@gmail.com.",
          "id": "team-maggies-dream-next",
          "cycle_label": "Applications",
          "kind": "awaiting",
          "date_confidence": "not_announced",
          "source_url": "https://www.teammaggiesdream.org/grants"
        }
      ],
      "source_urls": [
        "https://www.teammaggiesdream.org/grants"
      ]
    }
  ],
  "resources": [
    {
      "id": "resolve-directory",
      "name": "RESOLVE: Fertility Treatment Scholarships and Grants",
      "url": "https://resolve.org/learn/financial-resources/fertility-treatment-scholarships-and-grants/",
      "type": "Resource directory",
      "description": "A directory of nonprofit grant and scholarship programs kept by RESOLVE: The National Infertility Association. It is a list of other programs, not a grant itself. The page was dated September 2026 when checked.",
      "last_verified_at": "2026-10-18",
      "note": "The older address listed in earlier research no longer works. This is the current page."
    },
    {
      "id": "resolve-financial-resources",
      "name": "RESOLVE: Financial Resources for Family Building",
      "url": "https://resolve.org/learn/financial-resources/",
      "type": "Resource directory",
      "description": "RESOLVE's hub for financing programs, insurance information, and adoption financing.",
      "last_verified_at": "2026-10-18",
      "note": null
    },
    {
      "id": "embryo-adoption-article",
      "name": "Embryo Adoption Grants & Scholarships (2022 article)",
      "url": "https://embryoadoption.org/2022/11/embryo-adoption-grants-scholarships/",
      "type": "Resource article",
      "description": "An article from November 15, 2022 listing embryo adoption grants. Amounts and requirements are from 2022. Check each grant provider's own site for current details.",
      "last_verified_at": null,
      "note": "Historical. Not a grant itself."
    }
  ]
};
