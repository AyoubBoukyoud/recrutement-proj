<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Confidence threshold
    |--------------------------------------------------------------------------
    |
    | At or above this, an extraction is trusted enough to present as fact.
    | Below it the document is not thrown away: whatever was read is kept and
    | the candidate is asked to check it (`needs_review`). Only an extraction
    | that produced nothing usable at all becomes `failed`.
    |
    */

    'confidence_threshold' => (int) env('OCR_CONFIDENCE_THRESHOLD', 60),

    /*
    |--------------------------------------------------------------------------
    | Escalation to the paid engine
    |--------------------------------------------------------------------------
    |
    | Tesseract is free and local, and on a poorly lit phone photo it shows.
    | When a local pass comes back under the threshold, the document is sent
    | to the cloud model for a second opinion and the better result is kept.
    | Off by default in tests, and inert when no API key is configured.
    |
    */

    'escalate_to_cloud' => (bool) env('OCR_ESCALATE_TO_CLOUD', true),

    /*
    |--------------------------------------------------------------------------
    | Tesseract
    |--------------------------------------------------------------------------
    |
    | Candidates upload documents in French, Arabic, German and English.
    | Without `-l` Tesseract assumes English and mangles all three others.
    | Packs that are not installed on this machine are dropped from the list
    | at runtime rather than failing the run.
    |
    */

    'tesseract' => [
        'binary' => env('TESSERACT_BINARY', 'tesseract'),
        'languages' => array_filter(explode('+', env('TESSERACT_LANGUAGES', 'eng+fra+ara+deu'))),
        'psm' => env('TESSERACT_PSM', '3'),
    ],

];
