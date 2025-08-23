/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * message-handler.tsx
 * Copyright (C) 2025 Nextify Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 *
 */

import { useState } from "react";
import type { Message } from "../../types";

interface MessageHandlerProps {
  initialMessages?: Message[];
  onSendMessage?: (message: string) => Promise<void>;
}

/**
 * Logic component for handling chat messages
 */
export default function useMessageHandler({
  initialMessages = [],
  onSendMessage: externalSendHandler
}: MessageHandlerProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages.length > 0
    ? initialMessages
    : [
      {
        id: "welcome",
        role: "assistant",
        content: "Welcome to Zepid! I can help you analyze web pages and compare different versions."
      }
    ]
  );

  // Handle message sending
  const handleSendMessage = async (message: string) => {
    // Log recording

    // If external handler is provided, use external handling
    if (externalSendHandler) {
      return externalSendHandler(message);
    }

  };

  return {
    messages,
    setMessages,
    handleSendMessage
  };
} 