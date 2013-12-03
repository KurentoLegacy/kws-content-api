/*
 * (C) Copyright 2013 Kurento (http://kurento.org/)
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the GNU Lesser General Public License
 * (LGPL) version 2.1 which accompanies this distribution, and is available at
 * http://www.gnu.org/licenses/lgpl-2.1.html
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 */
var url  = document.URL;
var path = url.substring(0, url.lastIndexOf("/") + 1);

var config =
{
  videoUrls:
  {
    test1: path+"playerJsonTunnel",
    test2: path+"playerJsonTunnel",
    test3: path+"playerJsonFilter",
    test4: path+"playerJsonEvents"
  },
  kwsContentUploader: path+"recorder-record-with-redirect"
};