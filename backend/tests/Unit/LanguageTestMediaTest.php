<?php

namespace Tests\Unit;

use App\Services\LanguageTest\AudioForModel;
use App\Services\LanguageTest\InvalidOralRecording;
use App\Services\LanguageTest\SpeechSynthesizer;
use Tests\TestCase;

class LanguageTestMediaTest extends TestCase
{
    public function test_the_model_audio_is_extracted_from_the_camera_video(): void
    {
        $audio = app(AudioForModel::class);
        $source = base_path('tests/Fixtures/language-test/oral.mp4');
        $prepared = $audio->prepareVideo($source);
        try {
            $this->assertTrue($prepared['temporary']);
            $this->assertSame('audio/wav', $prepared['mime']);
            $this->assertEqualsWithDelta(9, $prepared['seconds'], 0.2);
            $this->assertNotSame($source, $prepared['path']);
            $this->assertSame('RIFF', file_get_contents($prepared['path'], false, null, 0, 4));
        } finally {
            $audio->release($prepared);
        }
        $this->assertFileDoesNotExist($prepared['path']);
    }

    public function test_an_audio_only_file_cannot_pass_as_a_camera_recording(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'oral-audio-only');
        file_put_contents($path, SpeechSynthesizer::wav(str_repeat("\0", 48000)));
        try {
            $this->expectException(InvalidOralRecording::class);
            app(AudioForModel::class)->prepareVideo($path);
        } finally {
            unlink($path);
        }
    }
}
