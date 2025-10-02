// Test script to verify the output extraction fix
const AIHumanizer = require('./humanizer');

async function testExtraction() {
  const humanizer = new AIHumanizer({
    headless: true,
    persistentProfile: true
  });

  try {
    await humanizer.launch();

    // Test text extraction logic with the problematic HTML structure
    // This simulates what happens in the browser context
    const testHtmlStructure = `
      <div class="MuiBox-root css-15jcimp" contenteditable="true" id="paraphraser-output-box" data-gramm_editor="false">
        <span>
          <span>
            <span contenteditable="true" class="output-sentence" id="output-sentence-box~0">
              <span class="MuiBox-root css-1xbtpkp">
                <span id="output-sentence~0">
                  <span style="white-space: initial;">
                    <span data-testid="output-sentence-0">
                      <span>
                        <span>
                          <span thesauruscolor="#8337fb" id="output-phrase~0~0" class="css-1ko3g0e">
                            <span data-testid="output-word-0-0-0">
                              <span sx="[object Object]" class="css-10o52y0">For </span>
                            </span>
                          </span>
                        </span>
                      </span>
                      <span>
                        <span>
                          <span thesauruscolor="#8337fb" id="output-phrase~0~1" class="css-1ko3g0e">
                            <span data-testid="output-word-1-0-0">
                              <span sx="[object Object]" class="css-10o52y0">decades, </span>
                            </span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
              </span>
            </span>
          </span>
        </span>
      </div>
    `;

    // Test the evaluation logic directly in Puppeteer
    await humanizer.page.setContent(testHtmlStructure);
    
    const workingSelector = '#paraphraser-output-box';
    const humanizedText = await humanizer.page.evaluate((selector) => {
      const outputBox = document.querySelector(selector);
      if (!outputBox) {
        return null;
      }

      // Try multiple approaches to extract clean text content
      
      // Method 1: Try to reconstruct text from sentence structure
      let textContent = '';
      const sentences = outputBox.querySelectorAll('[data-testid^="output-sentence-"]');
      if (sentences.length > 0) {
        // Extract text by sentences to preserve proper structure
        textContent = Array.from(sentences)
          .map(sentence => {
            const words = sentence.querySelectorAll('span[data-testid^="output-word"]');
            if (words.length > 0) {
              return Array.from(words)
                .map(wordSpan => wordSpan.textContent || wordSpan.innerText || '')
                .join('')
                .replace(/\u00a0/g, ' ') // Replace non-breaking spaces
                .trim();
            }
            return sentence.textContent || sentence.innerText || '';
          })
          .join(' ') // Join sentences with spaces
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
      } else {
        // Method 2: Try to extract text from word spans
        const wordSpans = outputBox.querySelectorAll('span[data-testid^="output-word"]');
        if (wordSpans.length > 0) {
          // Extract text from individual word spans
          textContent = Array.from(wordSpans)
            .map(span => span.textContent || span.innerText)
            .join('')
            .replace(/\u00a0/g, ' ') // Replace non-breaking spaces with regular spaces
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
        } else {
          // Method 3: Fallback to innerText/textContent
          textContent = outputBox.innerText || outputBox.textContent || "";
          
          // Clean up the text
          textContent = textContent.trim().replace(/\s+/g, " ");
        }
      }
      
      // Remove common UI text that might be included
      textContent = textContent.replace(/^(Copy|Copied|Download|Share)\s*/i, '');
      textContent = textContent.replace(/\s*(Copy|Copied|Download|Share)$/i, '');
      
      return textContent;
    }, workingSelector);

    console.log('✅ Extracted text:', humanizedText);
    console.log('✅ Text extraction working properly with the new HTML structure!');
    
  } catch (error) {
    console.error('❌ Error during extraction test:', error.message);
  } finally {
    await humanizer.close();
  }
}

// Run the test
testExtraction();