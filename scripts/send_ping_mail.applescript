on run argv
    set draftOnly to false
    if (count of argv) > 3 and item -1 of argv is "--draft" then
        set draftOnly to true
        set argv to items 1 thru -2 of argv
    end if
    set recipientAddresses to paragraphs of (item 1 of argv)
    set subjectText to item 2 of argv
    set messageText to item 3 of argv
    -- Leave a separate first paragraph for the inline poster.
    set bodyText to linefeed & linefeed & messageText & linefeed
    tell application "Mail"
        set outgoing to make new outgoing message with properties {subject:subjectText, content:bodyText, visible:false}
        tell outgoing
            set message signature to missing value
            repeat with recipientAddress in recipientAddresses
                make new to recipient at end of to recipients with properties {address:(recipientAddress as text)}
            end repeat
            tell content
                set font to "Helvetica"
                set size to 15
            end tell
            set bodyParagraphs to paragraphs of bodyText
            repeat with paragraphIndex from 1 to count of bodyParagraphs
                set paragraphText to item paragraphIndex of bodyParagraphs as text
                if paragraphText is "Mina bedömningar" then
                    set font of paragraph paragraphIndex of content to "Helvetica-Bold"
                    set size of paragraph paragraphIndex of content to 22
                else if paragraphText starts with "Spel " and paragraphText contains ": " then
                    set font of paragraph paragraphIndex of content to "Helvetica-Bold"
                    set size of paragraph paragraphIndex of content to 18
                else if paragraphText is "Varför detta spel?" or paragraphText is "Risker" then
                    set font of paragraph paragraphIndex of content to "Helvetica-Bold"
                end if
            end repeat
            -- Insert last so attachment insertion cannot shift the styled paragraphs.
            if (count of argv) > 3 then
                set attachmentFile to POSIX file (item 4 of argv) as alias
                make new attachment with properties {file name:attachmentFile} at before first paragraph of content
            end if
        end tell
        if draftOnly then
            save outgoing
            return id of outgoing as text
        end if
        if not (send outgoing) then error "Apple Mail did not accept the email for sending."
    end tell
end run
